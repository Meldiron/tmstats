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
/** Heartbeats are cheap, but not free - one write per 10s of work is plenty. */
const HEARTBEAT_THROTTLE_MS = 10_000;

const nowIso = () => new Date().toISOString();

/**
 * Owns the `syncs/<userId>` document for the lifetime of this execution. Every exit
 * path writes a terminal status, so the UI never waits on a sync that is already over.
 */
class SyncTracker {
	#lastHeartbeatAt = 0;
	#done = false;

	step = '';

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

	async begin() {
		this.#lastHeartbeatAt = Date.now();

		await this.#write({
			status: 'processing',
			type: this.type,
			heartbeatAt: nowIso(),
			progress: 'Starting',
			finishedAt: null,
			error: null
		});
	}

	async heartbeat(progress: string) {
		if (this.#done || Date.now() - this.#lastHeartbeatAt < HEARTBEAT_THROTTLE_MS) {
			return;
		}

		this.#lastHeartbeatAt = Date.now();

		await this.#write({
			status: 'processing',
			heartbeatAt: nowIso(),
			progress: progress.slice(0, 255)
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

		await tracker.heartbeat(`${tracker.step} - ${Object.keys(newMedals).length} maps checked`);
	};

	if (payload.type === 'all') {
		newMedals = {};

		tracker.step = 'Weekly shorts';
		newMedals = { ...newMedals, ...(await Daily.getMedalsShorts(appwriteUserId, db, null, null, existingMedals, saveProgress)) };

		tracker.step = 'Weekly grands';
		newMedals = { ...newMedals, ...(await Daily.getMedalsWeeklyGrand(appwriteUserId, db, null, null, existingMedals, saveProgress)) };

		tracker.step = 'Campaigns';
		newMedals = { ...newMedals, ...(await Daily.getMedalsCampaign(appwriteUserId, db, null, existingMedals, saveProgress)) };

		tracker.step = 'Track of the day';
		newMedals = { ...newMedals, ...(await Daily.getMedals(appwriteUserId, db, null, null, existingMedals, saveProgress)) };
	} else if (payload.type === 'cotd') {
		if (!payload.year) {
			return { message: "This action requires 'year'.", code: 400 };
		}

		if (!payload.month) {
			return { message: "This action requires 'month'.", code: 400 };
		}

		tracker.step = 'Track of the day';
		newMedals = await Daily.getMedals(appwriteUserId, db, payload.year, payload.month, existingMedals, saveProgress);
	} else if (payload.type === 'shorts') {
		if (!payload.year) {
			return { message: "This action requires 'year'.", code: 400 };
		}
		if (!payload.week) {
			return { message: "This action requires 'week'.", code: 400 };
		}

		tracker.step = 'Weekly shorts';
		newMedals = await Daily.getMedalsShorts(appwriteUserId, db, payload.year, payload.week, existingMedals, saveProgress);
	} else if (payload.type === 'grands') {
		if (!payload.year) {
			return { message: "This action requires 'year'.", code: 400 };
		}

		tracker.step = 'Weekly grands';
		newMedals = await Daily.getMedalsWeeklyGrand(appwriteUserId, db, payload.year, payload.week ?? null, existingMedals, saveProgress);
	} else if (payload.type === 'campaign') {
		if (!payload.campaignUid) {
			return { message: "This action requires 'campaignUid'.", code: 400 };
		}

		tracker.step = 'Campaigns';
		newMedals = await Daily.getMedalsCampaign(appwriteUserId, db, payload.campaignUid, existingMedals, saveProgress);
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

		tracker = new SyncTracker(context, appwriteUserId, payload.type ?? 'all');
		await tracker.begin();

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
