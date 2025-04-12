<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { AppwriteMap } from './appwrite';

	const { title, subtitle, maps, medals, medalType, nadeoAction } = $props();

	let isLoading = $state(false);
	async function load() {
		if (isLoading) {
			return;
		}

		isLoading = true;

		try {
			await nadeoAction();
			await invalidateAll();
		} finally {
			isLoading = false;
		}
	}

	let isOpened = $state(false);
	let openedMap = $state<null | AppwriteMap>(null);
	async function openModal(event: Event, map: AppwriteMap) {
		event.preventDefault();
		isOpened = true;
		openedMap = map;
	}
	function closeModal() {
		isOpened = false;
		openedMap = null;
	}

	function formatTime(ms: number) {
		const mins = Math.floor(ms / 1000 / 60);
		ms -= mins * 1000 * 60;
		const secs = Math.floor(ms / 1000);
		ms -= secs * 1000;

		return `${mins < 10 ? '0' + mins : mins}:${secs < 10 ? '0' + secs : secs}.${
			ms > 99 ? ms : '0' + ms
		}`;
	}
</script>

{#if isOpened && openedMap}
	<div
		role="button"
		tabindex="0"
		onmousedown={closeModal}
		aria-label="Close modal"
		class="fixed inset-0 top-0 right-0 left-0 z-50 flex w-full justify-center overflow-x-hidden overflow-y-auto bg-slate-900/75 md:h-full"
	>
		<div class="relative w-full max-w-2xl sm:pt-4">
			<div
				class="relative rounded-lg bg-white shadow"
				role="button"
				tabindex="0"
				aria-label="Do not close modal"
				onmousedowncapture={(event) => event.stopPropagation()}
			>
				<div class="flex items-start justify-between rounded-t p-4">
					<h3 class="text-xl font-semibold text-gray-900">{openedMap.name}</h3>
					<button
						aria-label="Close modal"
						onclick={closeModal}
						type="button"
						class="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900"
						data-modal-toggle="defaultModal"
					>
						<svg
							class="h-5 w-5"
							fill="currentColor"
							viewBox="0 0 20 20"
							xmlns="http://www.w3.org/2000/svg"
							><path
								fill-rule="evenodd"
								d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
								clip-rule="evenodd"
							/></svg
						>
					</button>
				</div>

				<div class="p-6 pt-0">
					<div class="aspect-video w-full overflow-hidden rounded-lg bg-gray-200 shadow-inner">
						<img
							src={openedMap.thumbnailUrl}
							class="h-full w-full object-cover object-center"
							alt=""
						/>
					</div>
				</div>

				<div class="space-y-6 p-6 pt-0">
					<div class="block">
						<span
							class="inline-flex items-center space-x-2 rounded bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-200"
							><svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
									clip-rule="evenodd"
								/>
							</svg>
							<span>{openedMap.$id}</span>
						</span>
					</div>

					<div>
						<h1 class="mb-2 text-xl font-bold">Medal Times</h1>

						<div class="flex flex-col space-y-4">
							<div class="flex items-center space-x-3">
								<img src="/author.png" class="w-7" alt="" />
								<p class="min-w-[100px] text-lg">{formatTime(openedMap.authorScore)}</p>
							</div>
							<div class="flex items-center space-x-3">
								<img src="/gold.png" class="w-7" alt="" />
								<p class="min-w-[100px] text-lg">{formatTime(openedMap.goldScore)}</p>
							</div>
							<div class="flex items-center space-x-3">
								<img src="/silver.png" class="w-7" alt="" />
								<p class="min-w-[100px] text-lg">{formatTime(openedMap.silverScore)}</p>
							</div>
							<div class="flex items-center space-x-3">
								<img src="/bronze.png" class="w-7" alt="" />
								<p class="min-w-[100px] text-lg">{formatTime(openedMap.bronzeScore)}</p>
							</div>
						</div>
					</div>

					<div>
						<h1 class="mb-2 text-xl font-bold">Your Time</h1>

						{#if medals[medalType + '-' + openedMap.key]}
							<div class="flex items-center space-x-3">
								{#if medals[medalType + '-' + openedMap.key].medal === 4}
									<img src="/author.png" class="w-7" alt="" />
								{:else if medals[medalType + '-' + openedMap.key].medal === 3}
									<img src="/gold.png" class="w-7" alt="" />
								{:else if medals[medalType + '-' + openedMap.key].medal === 2}
									<img src="/silver.png" class="w-7" alt="" />
								{:else if medals[medalType + '-' + openedMap.key].medal === 1}
									<img src="/bronze.png" class="w-7" alt="" />
								{/if}

								<p class="min-w-[100px] text-lg">
									{medals[medalType + '-' + openedMap.key].time
										? formatTime(medals[medalType + '-' + openedMap.key].time)
										: 'N/A'}
								</p>
							</div>
						{:else}
							<p class="min-w-[100px] text-lg">
								<span class="font-bold text-red-500">NO MEDAL</span>

								{#if medals[medalType + '-' + openedMap.key]}
									<span
										>{medals[medalType + '-' + openedMap.key].time
											? formatTime(medals[medalType + '-' + openedMap.key].time)
											: 'N/A'}</span
									>
								{/if}
							</p>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<section
	class="relative col-span-6 rounded-tl-3xl rounded-br-3xl border border-gray-900 bg-gray-800 p-4 sm:col-span-6 md:col-span-4 lg:col-span-4"
>
	<div class="flex items-center justify-between">
		<h3 class="text-2xl font-bold text-gray-200">
			{title}
		</h3>
		<div>
			<button
				aria-label="Sync week"
				disabled={isLoading}
				onclick={load}
				class="rounded-tl-2xl rounded-br-2xl bg-gray-700 px-4 py-2 font-bold text-white enabled:hover:bg-gray-600 disabled:opacity-50"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="size-5"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
					/>
				</svg>
			</button>
		</div>
	</div>

	{#if subtitle}
		<h4 class="-mt-1 mb-3 font-semibold text-gray-400">{subtitle}</h4>
	{/if}

	<div class="mt-4 flex flex-wrap gap-x-[0.35rem]">
		{#each maps as map (map['$id'])}
			{@const medal = medals[medalType + '-' + map.key]?.medal ?? 0}
			<div class="group relative">
				<div
					class="absolute bottom-[calc(100%+0.5rem)] z-20 hidden rounded-tl-xl rounded-br-xl border border-slate-600 bg-slate-900 px-3 py-1 text-center whitespace-nowrap text-white group-hover:block"
				>
					{map.name}
				</div>

				<button
					onclick={(event) => openModal(event, map)}
					aria-label="View map"
					class={`${
						medal === 4
							? 'bg-[#14b583]'
							: medal === 3
								? 'bg-[#ffd700]'
								: medal === 2
									? 'bg-[#e0e0e0]'
									: medal === 1
										? 'bg-[#cd7f32]'
										: 'bg-[#374151]'
					} h-6 w-6 rounded-tl-lg rounded-br-lg`}
				></button>
			</div>
		{/each}
	</div>
</section>
