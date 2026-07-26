import {
	Client,
	Databases,
	Query,
	Functions,
	Permission,
	Role,
	type Models,
	Account
} from 'appwrite';
import {
	Client as ServerClient,
	Databases as ServerDatabases,
	Users as ServerUsers
} from 'node-appwrite';
import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';

export type AppwriteMap = {
	mapid: string;
	mapUid: string;
	silverScore: number;
	bronzeScore: number;
	goldScore: number;
	authorScore: number;
	warriorScore: number | null;
	thumbnailUrl: string; // URL
	collectionName: string;
	name: string;
	key: string;
} & Models.Document;

export type AppwriteProfile = {
	silver: number;
	bronze: number;
	gold: number;
	author: number;
	warrior: number;
	nickname: string;
	score: number;
	medals: string; // Convert to JSON
} & Models.Document;

export type SyncStatus = 'queued' | 'processing' | 'success' | 'error';

export type AppwriteSync = {
	status: SyncStatus;
	type: string;
	params: string | null;
	executionId: string | null;
	startedAt: string;
	heartbeatAt: string;
	finishedAt: string | null;
	deadlineAt: string;
	progress: string | null;
	error: string | null;
	processed: number | null;
	total: number | null;
	phase: number | null;
	phaseCount: number | null;
} & Models.Document;

export type SyncParams = {
	year?: number;
	month?: number;
	week?: number;
	campaignUid?: string;
};

/** Must stay in sync with the `nadeoAction` timeout in appwrite.json. */
export const SYNC_FUNCTION_TIMEOUT_MS = 900_000;
/** Extra room on top of the function timeout before we call a sync dead. */
export const SYNC_DEADLINE_GRACE_MS = 60_000;
/** A queued execution that was never picked up by a worker. */
export const SYNC_QUEUE_TIMEOUT_MS = 300_000;
/** A running execution that stopped writing heartbeats. */
export const SYNC_HEARTBEAT_TIMEOUT_MS = 180_000;

export function isSyncPending(sync: AppwriteSync | null): boolean {
	return sync !== null && (sync.status === 'queued' || sync.status === 'processing');
}

/**
 * Overall completion, or null while the function has not reported a total yet - that
 * gap is what the indeterminate spinner covers.
 *
 * A full sync walks four categories whose sizes are only known once each one starts,
 * so phases are weighted equally rather than by map count. Within a phase the count is
 * exact. Capped at 99% until the document actually reports success, so the bar never
 * sits at 100% while work is still happening.
 */
export function syncPercent(sync: AppwriteSync | null): number | null {
	if (!sync || sync.total === null || sync.phase === null || sync.phaseCount === null) {
		return null;
	}

	const phaseCount = Math.max(1, sync.phaseCount);
	const fraction = sync.total > 0 ? Math.min(1, (sync.processed ?? 0) / sync.total) : 1;
	const overall = (Math.min(sync.phase, phaseCount - 1) + fraction) / phaseCount;

	return Math.max(0, Math.min(99, Math.round(overall * 100)));
}

/**
 * The zombie guard: a pending sync is dead the moment any of these trip, no matter
 * what the database says, so the UI can never show a spinner forever - even if nothing
 * ever writes to the document again.
 *
 * `observedAt` is the local timestamp of the last time the document actually changed.
 * The queue and heartbeat guards measure against it rather than against the document's
 * own timestamps, because those are written by the function's clock, not the browser's.
 */
export function syncStaleReason(
	sync: AppwriteSync | null,
	observedAt: number,
	now = Date.now()
): string | null {
	if (!isSyncPending(sync) || !sync) {
		return null;
	}

	if (now > new Date(sync.deadlineAt).getTime()) {
		return 'Sync timed out. The update ran longer than the maximum allowed time and was stopped.';
	}

	if (sync.status === 'queued' && now > observedAt + SYNC_QUEUE_TIMEOUT_MS) {
		return 'Sync never started. The request was accepted but no worker picked it up.';
	}

	if (sync.status === 'processing' && now > observedAt + SYNC_HEARTBEAT_TIMEOUT_MS) {
		return 'Sync stopped responding. The update crashed or was interrupted mid-run.';
	}

	return null;
}

export type AppwriteWeeklyMaps = {
	week: number;
	year: number;
	position: number;
} & AppwriteMap;

export type AppwriteWeeklyGrandMaps = {
	week: number;
	year: number;
	position: number;
} & AppwriteMap;

export type AppwriteDailyMaps = {
	day: number;
	month: number;
	year: number;
} & AppwriteMap;

export type AppwriteCampaignMap = {
	position: number;
	campaignUid: string;
} & AppwriteMap;

const client = new Client();
client.setEndpoint('https://cloud.appwrite.io/v1').setProject('tmStats');

const functions = new Functions(client);
const account = new Account(client);
const database = new Databases(client);

export const toastConfig: Toastify.Options = {
	duration: 5000,
	close: true,
	gravity: 'top',
	position: 'center',
	stopOnFocus: true,
	style: {
		background: '#ef4444'
	}
	// onClick: function(){}
};
export class AppwriteService {
	static async getAccount() {
		try {
			return await account.get();
		} catch {
			return null;
		}
	}

	static async signOut() {
		await account.deleteSession('current');
	}

	static async createSession(userId: string, secret: string) {
		await account.createSession(userId, secret);
	}

	static async serverSetupProfile(apiKey: string, id: string, nickname: string) {
		const client = new ServerClient();
		client.setEndpoint('https://cloud.appwrite.io/v1').setProject('tmStats').setKey(apiKey);
		const database = new ServerDatabases(client);

		try {
			await database.getDocument<AppwriteProfile>('default', 'profiles', id);
		} catch {
			await database.createDocument('default', 'profiles', id, {
				medals: JSON.stringify({}),
				score: 0,
				gold: 0,
				author: 0,
				bronze: 0,
				silver: 0,
				warrior: 0,
				nickname
			});
		}
	}

	static async serverStoreCredentials(
		apiKey: string,
		userId: string,
		accessToken: string,
		refreshToken: string,
		expiresAt: number
	) {
		const client = new ServerClient();
		client.setEndpoint('https://cloud.appwrite.io/v1').setProject('tmStats').setKey(apiKey);
		const database = new ServerDatabases(client);

		try {
			await database.createDocument('default', 'oauthTokens', userId, {
				accessToken,
				refreshToken,
				expiresAt
			});
		} catch {
			await database.updateDocument('default', 'oauthTokens', userId, {
				accessToken,
				refreshToken,
				expiresAt
			});
		}
	}

	static async serverCreateSession(apiKey: string, userId: string, name: string) {
		const client = new ServerClient();
		client.setEndpoint('https://cloud.appwrite.io/v1').setProject('tmStats').setKey(apiKey);
		const users = new ServerUsers(client);

		try {
			await users.get(userId);
		} catch {
			await users.create(userId);
		}

		await users.updateName(userId, name);

		const token = await users.createToken(userId);

		return token;
	}

	static normalizeProfile(doc: AppwriteProfile): AppwriteProfile {
		return {
			...doc,
			warrior: (doc.warrior as any) ?? 0,
			author: (doc.author as any) ?? 0,
			gold: (doc.gold as any) ?? 0,
			silver: (doc.silver as any) ?? 0,
			bronze: (doc.bronze as any) ?? 0,
			score: (doc.score as any) ?? 0
		};
	}

	static async getProfile(id: string) {
		try {
			const dbRes = await database.getDocument<AppwriteProfile>('default', 'profiles', id);
			const dataSet = JSON.parse(dbRes.medals);
			return this.normalizeProfile({
				...dbRes,
				medals: dataSet
			});
		} catch (err: unknown) {
			console.error(err);

			const msg = err instanceof Error ? err.message : 'An unknown error occurred';

			Toastify({
				...toastConfig,
				text: 'Could not load profile: ' + msg
			}).showToast();
		}
	}

	static async getCampaignMaps() {
		try {
			const maps = [];
			let cursor: null | string = null;

			do {
				const queries = [Query.limit(500), Query.orderDesc('$createdAt')];

				if (cursor) {
					queries.push(Query.cursorAfter(cursor));
				}

				const dbRes = await database.listDocuments<AppwriteCampaignMap>(
					'default',
					'campaignMaps',
					queries
				);

				maps.push(...dbRes.documents);

				if (dbRes.documents.length > 0) {
					cursor = dbRes.documents[dbRes.documents.length - 1].$id;
				} else {
					cursor = null;
				}
			} while (cursor !== null);

			return maps;
		} catch (err: unknown) {
			console.error(err);

			const msg = err instanceof Error ? err.message : 'An unknown error occurred';

			Toastify({
				...toastConfig,
				text: 'Could not load campaigns: ' + msg
			}).showToast();

			return [];
		}
	}

	static async getWeeklyMaps() {
		try {
			const maps = [];
			let cursor: null | string = null;

			do {
				const queries = [Query.limit(500), Query.orderDesc('$createdAt')];

				if (cursor) {
					queries.push(Query.cursorAfter(cursor));
				}

				const dbRes = await database.listDocuments<AppwriteWeeklyMaps>(
					'default',
					'weeklyMaps',
					queries
				);

				maps.push(...dbRes.documents);

				if (dbRes.documents.length > 0) {
					cursor = dbRes.documents[dbRes.documents.length - 1].$id;
				} else {
					cursor = null;
				}
			} while (cursor !== null);

			return maps;
		} catch (err: unknown) {
			console.error(err);

			const msg = err instanceof Error ? err.message : 'An unknown error occurred';

			Toastify({
				...toastConfig,
				text: 'Could not load weekly shorts: ' + msg
			}).showToast();

			return [];
		}
	}

	static async getWeeklyGrandMaps() {
		try {
			const maps = [];
			let cursor: null | string = null;

			do {
				const queries = [Query.limit(500), Query.orderDesc('$createdAt')];

				if (cursor) {
					queries.push(Query.cursorAfter(cursor));
				}

				const dbRes = await database.listDocuments<AppwriteWeeklyGrandMaps>(
					'default',
					'weeklyGrandMaps',
					queries
				);

				maps.push(...dbRes.documents);

				if (dbRes.documents.length > 0) {
					cursor = dbRes.documents[dbRes.documents.length - 1].$id;
				} else {
					cursor = null;
				}
			} while (cursor !== null);

			return maps;
		} catch (err: unknown) {
			console.error(err);

			const msg = err instanceof Error ? err.message : 'An unknown error occurred';

			Toastify({
				...toastConfig,
				text: 'Could not load weekly grands: ' + msg
			}).showToast();

			return [];
		}
	}

	static async getDailyMaps() {
		try {
			const maps = [];
			let cursor: null | string = null;

			do {
				const queries = [Query.limit(500), Query.orderDesc('$createdAt')];

				if (cursor) {
					queries.push(Query.cursorAfter(cursor));
				}

				const dbRes = await database.listDocuments<AppwriteDailyMaps>(
					'default',
					'dailyMaps',
					queries
				);

				maps.push(...dbRes.documents);

				if (dbRes.documents.length > 0) {
					cursor = dbRes.documents[dbRes.documents.length - 1].$id;
				} else {
					cursor = null;
				}
			} while (cursor !== null);

			return maps;
		} catch (err: unknown) {
			console.error(err);

			const msg = err instanceof Error ? err.message : 'An unknown error occurred';

			Toastify({
				...toastConfig,
				text: 'Could not load track of the day maps: ' + msg
			}).showToast();

			return [];
		}
	}

	static async listProfiles(limit = 25, cursor: string | null = null) {
		try {
			const queries = [Query.limit(limit), Query.orderDesc('score')];

			if (cursor) {
				queries.push(Query.cursorAfter(cursor));
			}

			const docs = await database.listDocuments<AppwriteProfile>('default', 'profiles', queries);

			return docs.documents.map((doc) => this.normalizeProfile(doc));
		} catch (err: unknown) {
			console.error(err);

			const msg = err instanceof Error ? err.message : 'An unknown error occurred';

			Toastify({
				...toastConfig,
				text: 'Could not load leaderboard: ' + msg
			}).showToast();
		}

		return [];
	}

	static async getSync(userId: string): Promise<AppwriteSync | null> {
		try {
			return await database.getDocument<AppwriteSync>('default', 'syncs', userId);
		} catch {
			return null;
		}
	}

	static subscribeSync(userId: string, onChange: (sync: AppwriteSync | null) => void) {
		return client.subscribe<AppwriteSync>(
			`databases.default.collections.syncs.documents.${userId}`,
			(message) => {
				if (message.events.some((event) => event.endsWith('.delete'))) {
					onChange(null);
					return;
				}

				onChange(message.payload);
			}
		);
	}

	static async updateSync(userId: string, data: Partial<AppwriteSync>) {
		return await database.updateDocument<AppwriteSync>('default', 'syncs', userId, data);
	}

	static async clearSync(userId: string) {
		try {
			await database.deleteDocument('default', 'syncs', userId);
		} catch {
			// Already gone, nothing to clear
		}
	}

	/**
	 * Queues a profile sync. Returns as soon as the execution is accepted - progress
	 * is tracked through the `syncs` document, never through the execution itself.
	 */
	static async startSync(
		userId: string,
		type: string,
		params: SyncParams = {}
	): Promise<AppwriteSync> {
		const startedAt = new Date();
		const deadlineAt = new Date(
			startedAt.getTime() + SYNC_FUNCTION_TIMEOUT_MS + SYNC_DEADLINE_GRACE_MS
		);

		const data = {
			status: 'queued' as SyncStatus,
			type,
			params: JSON.stringify(params),
			executionId: null,
			startedAt: startedAt.toISOString(),
			heartbeatAt: startedAt.toISOString(),
			finishedAt: null,
			deadlineAt: deadlineAt.toISOString(),
			progress: null,
			error: null,
			processed: null,
			total: null,
			phase: null,
			phaseCount: null
		};

		try {
			await database.updateDocument<AppwriteSync>('default', 'syncs', userId, data);
		} catch {
			await database.createDocument<AppwriteSync>('default', 'syncs', userId, data, [
				Permission.read(Role.user(userId)),
				Permission.update(Role.user(userId)),
				Permission.delete(Role.user(userId))
			]);
		}

		try {
			const execution = await functions.createExecution(
				'nadeoAction',
				JSON.stringify({ type, ...params }),
				true
			);

			return await this.updateSync(userId, { executionId: execution.$id });
		} catch (err: unknown) {
			// The execution was never accepted, so nothing will ever finish this document
			const msg = err instanceof Error ? err.message : 'An unknown error occurred';

			return await this.updateSync(userId, {
				status: 'error',
				error: 'Could not start sync: ' + msg,
				finishedAt: new Date().toISOString()
			});
		}
	}

	static async getId(nick: string): Promise<string> {
		try {
			const res = await functions.createExecution(
				'convertId',
				JSON.stringify({
					nick
				}),
				false
			);

			if (res.responseStatusCode >= 400) {
				try {
					const json = JSON.parse(res.responseBody);
					throw new Error(json.message);
				} catch {
					throw new Error(res.responseBody);
				}
			}

			const bodyJson = JSON.parse(res.responseBody);

			if (bodyJson.code >= 400) {
				throw new Error(bodyJson.message);
			}

			const id: string = bodyJson.id;
			return id;
		} catch (err: unknown) {
			let msg = err instanceof Error ? err.message : 'An unknown error occurred';
			msg = "Could not get user's ID: " + msg;
			Toastify({
				...toastConfig,
				text: msg
			}).showToast();
		}

		return '';
	}
}
