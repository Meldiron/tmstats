import { invalidateAll } from '$app/navigation';
import Toastify from 'toastify-js';
import {
	AppwriteService,
	isSyncPending,
	syncStaleReason,
	toastConfig,
	type AppwriteSync,
	type SyncParams
} from '$lib/appwrite';

const POLL_FAST_MS = 2000;
const POLL_SLOW_MS = 5000;
/** How long we poll aggressively before backing off. */
const POLL_FAST_WINDOW_MS = 30_000;
const TICK_MS = 1000;

function toast(text: string, background: string) {
	Toastify({
		...toastConfig,
		text,
		style: { background }
	}).showToast();
}

/**
 * Single source of truth for "is this profile syncing right now". State lives in the
 * `syncs` document, so a reload, a second tab or a different device all see the same
 * thing, and a sync can never be lost by navigating away.
 */
class SyncStore {
	sync = $state<AppwriteSync | null>(null);
	/** Ticks every second so elapsed time and staleness stay live. */
	now = $state(Date.now());
	starting = $state(false);

	isActive = $derived(this.starting || isSyncPending(this.sync));
	isFailed = $derived(this.sync?.status === 'error');
	isVisible = $derived(this.isActive || this.isFailed);
	elapsedMs = $derived.by(() => {
		if (!this.sync) {
			return 0;
		}

		const startedAt = new Date(this.sync.startedAt).getTime();
		const endedAt = this.sync.finishedAt ? new Date(this.sync.finishedAt).getTime() : this.now;

		return Math.max(0, endedAt - startedAt);
	});

	#userId: string | null = null;
	#pollTimer: ReturnType<typeof setTimeout> | null = null;
	#tickTimer: ReturnType<typeof setInterval> | null = null;
	#unsubscribe: (() => void) | null = null;
	#onVisibility: (() => void) | null = null;
	#settling = false;
	/** Realtime and the poller can both deliver the same success - only celebrate once. */
	#settled = false;
	/** Local time the document last actually changed, used by the staleness guards. */
	#observedAt = Date.now();
	#observedSignature = '';

	/** Call once per mounted profile page you own. Returns a teardown for `$effect`. */
	init(userId: string) {
		if (this.#userId !== userId) {
			this.#teardown();
			this.#userId = userId;
			this.sync = null;
		}

		this.#tickTimer ??= setInterval(() => {
			this.now = Date.now();
			this.#checkStale();
		}, TICK_MS);

		if (!this.#onVisibility) {
			this.#onVisibility = () => {
				if (document.hidden) {
					this.#stopPolling();
				} else {
					this.#refresh();
				}
			};
			document.addEventListener('visibilitychange', this.#onVisibility);
		}

		this.#unsubscribe ??= AppwriteService.subscribeSync(userId, (doc) => this.#apply(doc));

		// Pick up a sync that was already running before this page loaded
		this.#refresh();

		return () => this.#teardown();
	}

	async start(type: string, params: SyncParams = {}) {
		if (!this.#userId || this.isActive) {
			return;
		}

		this.starting = true;
		this.#settled = false;

		try {
			const sync = await AppwriteService.startSync(this.#userId, type, params);
			this.#apply(sync);

			if (sync.status !== 'error') {
				toast('Sync started. This can take a few minutes.', '#14b583');
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'An unknown error occurred';
			toast('Could not start sync: ' + msg, '#ef4444');
		} finally {
			this.starting = false;
			this.#schedulePoll();
		}
	}

	async retry() {
		const failed = this.sync;

		if (!failed || this.isActive) {
			return;
		}

		let params: SyncParams = {};
		try {
			params = failed.params ? JSON.parse(failed.params) : {};
		} catch {
			params = {};
		}

		this.sync = null;
		await this.start(failed.type, params);
	}

	async dismiss() {
		if (!this.#userId || this.isActive) {
			return;
		}

		this.sync = null;
		await AppwriteService.clearSync(this.#userId);
	}

	#apply(doc: AppwriteSync | null) {
		this.sync = doc;

		if (!doc) {
			this.#observedSignature = '';
			this.#stopPolling();
			return;
		}

		const signature = `${doc.status}:${doc.heartbeatAt}`;
		if (signature !== this.#observedSignature) {
			this.#observedSignature = signature;
			this.#observedAt = Date.now();
		}

		if (this.#checkStale()) {
			return;
		}

		if (doc.status === 'success') {
			if (!this.#settled) {
				this.#settle(doc);
			}
			return;
		}

		if (doc.status === 'error') {
			this.#stopPolling();
			return;
		}

		// A pending document means a fresh run, so success is worth reporting again
		this.#settled = false;
		this.#schedulePoll();
	}

	/**
	 * Flips a dead sync to `error` locally the instant a guard trips, then persists it
	 * so every other tab and device agrees. Never waits for the server to notice.
	 */
	#checkStale(): boolean {
		const doc = this.sync;
		const reason = syncStaleReason(doc, this.#observedAt, Date.now());

		if (!doc || !reason || !this.#userId) {
			return false;
		}

		const finishedAt = new Date().toISOString();
		this.sync = { ...doc, status: 'error', error: reason, finishedAt };
		this.#stopPolling();

		AppwriteService.updateSync(this.#userId, {
			status: 'error',
			error: reason,
			finishedAt
		}).catch(() => {
			// Local state already reflects the failure, the cron reaper is the backstop
		});

		return true;
	}

	async #settle(doc: AppwriteSync) {
		if (this.#settling) {
			return;
		}

		this.#settling = true;
		this.#settled = true;
		this.#stopPolling();

		try {
			toast('Medals updated successfully.', '#14b583');
			await invalidateAll();

			if (this.#userId) {
				await AppwriteService.clearSync(this.#userId);
			}

			if (this.sync?.$id === doc.$id && this.sync?.status === 'success') {
				this.sync = null;
			}
		} finally {
			this.#settling = false;
		}
	}

	async #refresh() {
		if (!this.#userId) {
			return;
		}

		const doc = await AppwriteService.getSync(this.#userId);

		// A sync that finished while we were away has already been cleaned up
		if (doc === null && this.sync === null) {
			return;
		}

		this.#apply(doc);
	}

	#schedulePoll() {
		if (this.#pollTimer !== null || document.hidden) {
			return;
		}

		const startedAt = this.sync ? new Date(this.sync.startedAt).getTime() : Date.now();
		const delay = Date.now() - startedAt < POLL_FAST_WINDOW_MS ? POLL_FAST_MS : POLL_SLOW_MS;

		this.#pollTimer = setTimeout(() => {
			this.#pollTimer = null;

			if (this.isActive) {
				this.#refresh();
			}
		}, delay);
	}

	#stopPolling() {
		if (this.#pollTimer !== null) {
			clearTimeout(this.#pollTimer);
			this.#pollTimer = null;
		}
	}

	#teardown() {
		this.#stopPolling();

		if (this.#tickTimer !== null) {
			clearInterval(this.#tickTimer);
			this.#tickTimer = null;
		}

		if (this.#unsubscribe) {
			this.#unsubscribe();
			this.#unsubscribe = null;
		}

		if (this.#onVisibility) {
			document.removeEventListener('visibilitychange', this.#onVisibility);
			this.#onVisibility = null;
		}
	}
}

export const sync = new SyncStore();

export function formatDuration(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	if (hours > 0) {
		return `${hours}h ${minutes}m`;
	}

	if (minutes > 0) {
		return `${minutes}m ${seconds}s`;
	}

	return `${seconds}s`;
}
