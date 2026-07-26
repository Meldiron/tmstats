<script lang="ts">
	import { sync, formatDuration } from '$lib/sync.svelte';

	const labels: Record<string, string> = {
		all: 'Entire profile',
		cotd: 'Track of the day',
		shorts: 'Weekly shorts',
		grands: 'Weekly grands',
		campaign: 'Campaign'
	};

	let showDetails = $state(false);

	const label = $derived(sync.sync ? (labels[sync.sync.type] ?? sync.sync.type) : '');
	const elapsed = $derived(formatDuration(sync.elapsedMs));

	/** The category being worked on right now, plus its position in a multi-part sync. */
	const step = $derived.by(() => {
		const doc = sync.sync;

		if (!doc?.progress) {
			return label;
		}

		return doc.phaseCount && doc.phaseCount > 1
			? `${doc.progress} (${(doc.phase ?? 0) + 1}/${doc.phaseCount})`
			: doc.progress;
	});

	const detail = $derived.by(() => {
		const doc = sync.sync;

		if (!doc) {
			return '';
		}

		if (doc.status === 'queued') {
			return 'Waiting to start';
		}

		if (doc.total === null) {
			return 'Counting maps';
		}

		if (doc.total === 0) {
			return 'Nothing new to check';
		}

		return `${doc.processed ?? 0} of ${doc.total} maps checked`;
	});
</script>

{#if sync.isVisible && sync.sync}
	{#if sync.isFailed}
		<div
			class="mt-3 rounded-tl-3xl rounded-br-3xl border border-red-900 bg-red-950/60 p-4 text-white"
		>
			<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex items-center space-x-3">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="size-6 shrink-0 text-red-400"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
						/>
					</svg>

					<div>
						<p class="font-bold">Sync failed</p>
						<p class="text-sm text-red-200">
							{label} &middot; stopped after {elapsed}
						</p>
					</div>
				</div>

				<div class="flex items-center space-x-2">
					<button
						onclick={() => (showDetails = !showDetails)}
						class="rounded-tl-2xl rounded-br-2xl bg-red-900/70 px-4 py-2 text-sm font-semibold text-white hover:bg-red-900"
					>
						{showDetails ? 'Hide details' : 'Show details'}
					</button>
					<button
						onclick={() => sync.retry()}
						class="rounded-tl-2xl rounded-br-2xl bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600"
					>
						Retry
					</button>
					<button
						aria-label="Dismiss sync error"
						onclick={() => sync.dismiss()}
						class="rounded-tl-2xl rounded-br-2xl bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600"
					>
						Dismiss
					</button>
				</div>
			</div>

			{#if showDetails}
				<div class="mt-3 rounded-tl-2xl rounded-br-2xl bg-slate-900 p-3 text-xs text-slate-300">
					<p class="break-words whitespace-pre-wrap">
						{sync.sync.error ?? 'No error details were recorded.'}
					</p>
					<dl class="mt-3 space-y-1 text-slate-500">
						<div class="flex space-x-2">
							<dt>Started</dt>
							<dd>{new Date(sync.sync.startedAt).toLocaleString()}</dd>
						</div>
						<div class="flex space-x-2">
							<dt>Last progress</dt>
							<dd>{new Date(sync.sync.heartbeatAt).toLocaleString()}</dd>
						</div>
						{#if sync.sync.executionId}
							<div class="flex space-x-2">
								<dt>Execution</dt>
								<dd>{sync.sync.executionId}</dd>
							</div>
						{/if}
					</dl>
				</div>
			{/if}
		</div>
	{:else}
		<div
			class="mt-3 rounded-tl-3xl rounded-br-3xl border border-gray-900 bg-gray-800 p-4 text-white"
		>
			<div class="flex items-center space-x-3">
				{#if sync.percent === null}
					<svg
						class="size-6 shrink-0 animate-spin text-blue-400"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
						></path>
					</svg>
				{:else}
					<span class="w-12 shrink-0 text-right text-xl font-bold text-blue-400 tabular-nums">
						{sync.percent}%
					</span>
				{/if}

				<div>
					<p class="font-bold">
						Syncing your profile &middot; {elapsed}
					</p>
					<p class="text-sm text-gray-400">
						{step} &middot; {detail}
					</p>
				</div>
			</div>

			{#if sync.percent !== null}
				<div class="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-700">
					<div
						class="h-2 rounded-full bg-blue-500 transition-all duration-700 ease-out"
						style="width: {sync.percent}%"
					></div>
				</div>
			{/if}
		</div>
	{/if}
{/if}
