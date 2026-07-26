// deno-lint-ignore-file no-explicit-any

import { Auth } from './Auth.ts';
import { Daily } from './Daily.ts';
import { sdk, RateLimiter } from './deps.ts';

RateLimiter.Limiter = new RateLimiter();

let client: sdk.Client = null as any;
let db: sdk.Databases = null as any;

/** Must match the guards in src/lib/appwrite.ts. */
const QUEUE_TIMEOUT_MS = 300_000;
const HEARTBEAT_TIMEOUT_MS = 180_000;

function staleReason(doc: any, now: number): string | null {
	const startedAt = new Date(doc.startedAt).getTime();
	const heartbeatAt = new Date(doc.heartbeatAt).getTime();
	const deadlineAt = new Date(doc.deadlineAt).getTime();

	if (now > deadlineAt) {
		return 'Sync timed out. The update ran longer than the maximum allowed time and was stopped.';
	}

	if (doc.status === 'queued' && now > startedAt + QUEUE_TIMEOUT_MS) {
		return 'Sync never started. The request was accepted but no worker picked it up.';
	}

	if (doc.status === 'processing' && now > heartbeatAt + HEARTBEAT_TIMEOUT_MS) {
		return 'Sync stopped responding. The update crashed or was interrupted mid-run.';
	}

	return null;
}

/**
 * Backstop for zombie syncs: the browser marks dead syncs as failed the moment a guard
 * trips, but nobody is watching when the user closes the tab. This catches those.
 */
const reapStaleSyncs = async function (context: any): Promise<number> {
	let reaped = 0;

	try {
		const now = Date.now();
		const pending = await db.listDocuments('default', 'syncs', [
			sdk.Query.equal('status', ['queued', 'processing']),
			sdk.Query.orderAsc('heartbeatAt'),
			sdk.Query.limit(500)
		]);

		for (const doc of pending.documents as any[]) {
			const reason = staleReason(doc, now);

			if (!reason) {
				continue;
			}

			await db.updateDocument('default', 'syncs', doc.$id, {
				status: 'error',
				error: reason,
				progress: null,
				finishedAt: new Date().toISOString()
			});

			reaped++;
		}
	} catch (err) {
		context.log('Could not reap stale syncs: ' + err);
	}

	return reaped;
};

const func = async function (context: any) {
	if (!Deno.env.get('NADE_AUTH')) {
		return context.res.json({ message: 'Missing environment variables', code: 500 });
	}

	client = new sdk.Client();
	db = new sdk.Databases(client);

	client
		.setEndpoint(Deno.env.get('APPWRITE_FUNCTION_API_ENDPOINT') as string)
		.setProject(Deno.env.get('APPWRITE_FUNCTION_PROJECT_ID') as string)
		.setKey(context.req.headers['x-appwrite-key'] as string);

	const nadeoAuth = Deno.env.get('NADE_AUTH') as string;

	if (!Auth.Live) {
		Auth.Live = new Auth(db, 'NadeoLiveServices', nadeoAuth);
		await Auth.Live.load();
	}

	if (!Auth.Game) {
		Auth.Game = new Auth(db, 'NadeoServices', nadeoAuth);
		await Auth.Game.load();
	}

	const reaped = await reapStaleSyncs(context);

	const campaigns = await Daily.fetchMissingMapsCampaign(db);
	const weeks = await Daily.fetchMissingMapsWeekly(db);
	const grands = await Daily.fetchMissingMapsWeeklyGrand(db);
	const ids = await Daily.fetchMissingMaps(db);

	return context.res.json({
		message:
			'Map information updated! Downloaded ' +
			ids.length +
			' maps: ' +
			ids +
			' and ' +
			weeks.length +
			' weeks: ' +
			weeks +
			' and ' +
			grands.length +
			' grands: ' +
			grands +
			' and ' +
			campaigns.length +
			' campaigns: ' +
			campaigns +
			'. Reaped ' +
			reaped +
			' stale syncs.'
	});
};

export default async function (context: any) {
	try {
		return await func(context);
	} catch (err) {
		console.log(err);
		return context.res.json({
			message: err
		});
	}
}
