// deno-lint-ignore-file no-explicit-any

import { Auth } from './Auth.ts';
import { Daily } from './Daily.ts';
import { getAxiod, sdk, RateLimiter } from './deps.ts';

// https://players.trackmania.com/server/dedicated

RateLimiter.Limiter = new RateLimiter();

let timeoutCache: any = {};

setInterval(() => {
	timeoutCache = {};
}, 60000 * 5);

let client: sdk.Client = null as any;
let db: sdk.Databases = null as any;

/** Keep in sync with the `nadeoAction` timeout in appwrite.json and SYNC_FUNCTION_TIMEOUT_MS. */
const FUNCTION_TIMEOUT_MS = 900_000;
const DEADLINE_GRACE_MS = 60_000;
/** Heartbeats are cheap, but not free. 5s keeps the progress bar moving smoothly. */
const HEARTBEAT_THROTTLE_MS = 5_000;

const nowIso = () => new Date().toISOString();

/**
 * Owns the `syncs/<userId>` document for the lifetime of this execution. Every exit
 * path writes a terminal status, so the UI never waits on a sync that is already over.
 */
class SyncTracker {
	#lastHeartbeatAt = 0;
	#done = false;

	#phase = 0;
	#phaseCount = 1;
	/** null means "not counted yet", which the UI shows as an indeterminate spinner. */
	#processed: number | null = null;
	#total: number | null = null;
	#step = '';

	constructor(
		private context: any,
		private userId: string,
		private type: string
	) {}

	async #write(data: any) {
		try {
			await db.updateDocument('default', 'syncs', this.userId, data);
		} catch (_err) {
			// No document yet (admin-triggered run), create one so the state is still visible
			try {
				const startedAt = nowIso();

				await db.createDocument(
					'default',
					'syncs',
					this.userId,
					{
						status: 'processing',
						type: this.type,
						startedAt,
						heartbeatAt: startedAt,
						deadlineAt: new Date(Date.now() + FUNCTION_TIMEOUT_MS + DEADLINE_GRACE_MS).toISOString(),
						...data
					},
					[
						`read("user:${this.userId}")`,
						`update("user:${this.userId}")`,
						`delete("user:${this.userId}")`
					]
				);
			} catch (err) {
				this.context.log('Could not write sync state: ' + err);
			}
		}
	}

	async begin(phaseCount: number) {
		this.#lastHeartbeatAt = Date.now();
		this.#phaseCount = phaseCount;

		await this.#write({
			status: 'processing',
			type: this.type,
			heartbeatAt: nowIso(),
			progress: 'Preparing',
			phase: 0,
			phaseCount,
			processed: null,
			total: null,
			finishedAt: null,
			error: null
		});
	}

	/** Moves to the next unit of work. Always written, so the bar never stalls. */
	async setPhase(phase: number, step: string) {
		this.#phase = phase;
		this.#step = step;
		this.#processed = null;
		this.#total = null;

		await this.#flush();
	}

	/** Called for every map checked. Throttled, except when the total first arrives. */
	async report(processed: number, total: number) {
		const isNewTotal = total !== this.#total;

		this.#processed = processed;
		this.#total = total;

		if (isNewTotal || Date.now() - this.#lastHeartbeatAt >= HEARTBEAT_THROTTLE_MS) {
			await this.#flush();
		}
	}

	/** Keeps the heartbeat guard fed during work that reports no ticks. */
	async touch() {
		if (Date.now() - this.#lastHeartbeatAt >= HEARTBEAT_THROTTLE_MS) {
			await this.#flush();
		}
	}

	async #flush() {
		if (this.#done) {
			return;
		}

		this.#lastHeartbeatAt = Date.now();

		await this.#write({
			status: 'processing',
			heartbeatAt: nowIso(),
			progress: this.#step.slice(0, 255),
			phase: this.#phase,
			phaseCount: this.#phaseCount,
			processed: this.#processed,
			total: this.#total
		});
	}

	async finish(status: 'success' | 'error', error: string | null = null) {
		if (this.#done) {
			return;
		}

		this.#done = true;

		await this.#write({
			status,
			heartbeatAt: nowIso(),
			finishedAt: nowIso(),
			progress: null,
			error: error === null ? null : error.slice(0, 9999)
		});
	}
}

const run = async function (context: any, tracker: SyncTracker, appwriteUserId: string, payload: any) {
	const nadeoAuth = Deno.env.get('NADE_AUTH') as string;

	if (!Auth.Live) {
		Auth.Live = new Auth(db, 'NadeoLiveServices', nadeoAuth);
		await Auth.Live.load();
	}

	if (!Auth.Game) {
		Auth.Game = new Auth(db, 'NadeoServices', nadeoAuth);
		await Auth.Game.load();
	}

	let newMedals: any = {};
	let existingMedals: any = {};

	try {
		const docRes = await db.getDocument('default', 'profiles', appwriteUserId);
		existingMedals = JSON.parse(docRes.medals);
	} catch (_err) {
		// OK
	}

	const tmRes = await (
		await getAxiod()
	).get('https://trackmania.io/api/player/' + appwriteUserId, {
		headers: {
			'User-Agent': 'tmstats.almostapps.eu / 0.0.3 matejbaco2000@gmail.com'
		}
	});
	const nickname = tmRes?.data?.displayname ?? 'Unknown';

	const saveProgress = async (partialMedals: any) => {
		newMedals = { ...newMedals, ...partialMedals };

		const mergedMedals = { ...existingMedals, ...newMedals };

		let score = 0;
		let gold = 0;
		let author = 0;
		let silver = 0;
		let bronze = 0;
		let warrior = 0;

		for (const key in mergedMedals) {
			const medal = mergedMedals[key].medal;

			if (medal === 1) {
				bronze++;
				score += 1;
			} else if (medal === 2) {
				silver++;
				score += 2;
			} else if (medal === 3) {
				gold++;
				score += 4;
			} else if (medal === 4) {
				author++;
				score += 12;
			} else if (medal === 5) {
				warrior++;
				score += 20;
			}
		}

		const newDocData = {
			medals: JSON.stringify(mergedMedals),
			score,
			gold,
			author,
			bronze,
			silver,
			warrior,
			nickname
		};

		try {
			const docRes = await db.getDocument('default', 'profiles', appwriteUserId);
			const docId = docRes.$id;

			await db.updateDocument('default', 'profiles', docId, newDocData);
		} catch (_err) {
			await db.createDocument('default', 'profiles', appwriteUserId, newDocData);
		}

		await tracker.touch();
	};

	const reportProgress = async (processed: number, total: number) => {
		await tracker.report(processed, total);
	};

	if (payload.type === 'all') {
		newMedals = {};

		await tracker.setPhase(0, 'Weekly shorts');
		newMedals = { ...newMedals, ...(await Daily.getMedalsShorts(appwriteUserId, db, null, null, existingMedals, saveProgress, reportProgress)) };

		await tracker.setPhase(1, 'Weekly grands');
		newMedals = { ...newMedals, ...(await Daily.getMedalsWeeklyGrand(appwriteUserId, db, null, null, existingMedals, saveProgress, reportProgress)) };

		await tracker.setPhase(2, 'Campaigns');
		newMedals = { ...newMedals, ...(await Daily.getMedalsCampaign(appwriteUserId, db, null, existingMedals, saveProgress, reportProgress)) };

		await tracker.setPhase(3, 'Track of the day');
		newMedals = { ...newMedals, ...(await Daily.getMedals(appwriteUserId, db, null, null, existingMedals, saveProgress, reportProgress)) };
	} else if (payload.type === 'cotd') {
		if (!payload.year) {
			return { message: "This action requires 'year'.", code: 400 };
		}

		if (!payload.month) {
			return { message: "This action requires 'month'.", code: 400 };
		}

		await tracker.setPhase(0, 'Track of the day');
		newMedals = await Daily.getMedals(appwriteUserId, db, payload.year, payload.month, existingMedals, saveProgress, reportProgress);
	} else if (payload.type === 'shorts') {
		if (!payload.year) {
			return { message: "This action requires 'year'.", code: 400 };
		}
		if (!payload.week) {
			return { message: "This action requires 'week'.", code: 400 };
		}

		await tracker.setPhase(0, 'Weekly shorts');
		newMedals = await Daily.getMedalsShorts(appwriteUserId, db, payload.year, payload.week, existingMedals, saveProgress, reportProgress);
	} else if (payload.type === 'grands') {
		if (!payload.year) {
			return { message: "This action requires 'year'.", code: 400 };
		}

		await tracker.setPhase(0, 'Weekly grands');
		newMedals = await Daily.getMedalsWeeklyGrand(appwriteUserId, db, payload.year, payload.week ?? null, existingMedals, saveProgress, reportProgress);
	} else if (payload.type === 'campaign') {
		if (!payload.campaignUid) {
			return { message: "This action requires 'campaignUid'.", code: 400 };
		}

		await tracker.setPhase(0, 'Campaigns');
		newMedals = await Daily.getMedalsCampaign(appwriteUserId, db, payload.campaignUid, existingMedals, saveProgress, reportProgress);
	} else {
		return {
			message: "This action requires 'type' and it must be one of 'all', 'cotd', 'shorts', 'grands', or 'campaign'.",
			code: 400
		};
	}

	await saveProgress({});

	return { message: 'Profile successfully updated!', code: 200 };
};

export default async function (context: any) {
	let tracker: SyncTracker | null = null;

	try {
		context.log(context.req.bodyText);
		context.log('---');

		const payload = JSON.parse(context.req.bodyText || '{}');

		context.log(payload);

		let appwriteUserId = context.req.headers['x-appwrite-user-id'] as string;

		if (payload.adminPassword) {
			if (payload.adminPassword !== Deno.env.get('ADMIN_PASSWORD')) {
				return context.res.json({ message: 'Invalid admin password.', code: 403 }, 403);
			}

			if (!payload.userId) {
				return context.res.json(
					{ message: "This action requires 'userId' when using admin password.", code: 400 },
					400
				);
			}

			appwriteUserId = payload.userId;
		}

		if (!appwriteUserId) {
			return context.res.json({ message: 'This action requires a logged in user.', code: 401 }, 401);
		}

		client = new sdk.Client();
		db = new sdk.Databases(client);

		client
			.setEndpoint(Deno.env.get('APPWRITE_FUNCTION_API_ENDPOINT') as string)
			.setProject(Deno.env.get('APPWRITE_FUNCTION_PROJECT_ID') as string)
			.setKey(context.req.headers['x-appwrite-key'] as string);

		// A full sync walks four categories, everything else is a single unit of work
		tracker = new SyncTracker(context, appwriteUserId, payload.type ?? 'all');
		await tracker.begin(payload.type === 'all' ? 4 : 1);

		if (!Deno.env.get('NADE_AUTH')) {
			await tracker.finish('error', 'Missing environment variables.');
			return context.res.json({ message: 'Missing environment variables', code: 500 }, 500);
		}

		const result = await run(context, tracker, appwriteUserId, payload);

		if (result.code >= 400) {
			await tracker.finish('error', result.message);
		} else {
			await tracker.finish('success');
		}

		return context.res.json(result, result.code);
	} catch (err) {
		console.log(err);

		const message = err instanceof Error ? (err.stack ?? err.message) : String(err);

		// Never leave a sync pending - the UI would otherwise wait for the deadline
		if (tracker) {
			await tracker.finish('error', message);
		}

		return context.res.json({ message, code: 500 }, 500);
	}
}
