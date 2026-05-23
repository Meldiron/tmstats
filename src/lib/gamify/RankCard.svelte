<script lang="ts">
	import ProgressBar from './ProgressBar.svelte';
	import { RANKS } from './gamification';
	import type { RankInfo } from './gamification';

	interface Props {
		rank: RankInfo;
		score: number;
		completionPercent: number;
	}
	let { rank, score, completionPercent }: Props = $props();

	let isModalOpen = $state(false);

	function openModal() {
		isModalOpen = true;
	}
	function closeModal() {
		isModalOpen = false;
	}

	let expandedRanks = $state<Set<string>>(new Set());
	$effect(() => {
		if (isModalOpen) {
			expandedRanks = new Set([rank.current.baseRank]);
		}
	});
	function toggleRank(baseRank: string) {
		const next = new Set(expandedRanks);
		if (next.has(baseRank)) {
			next.delete(baseRank);
		} else {
			next.add(baseRank);
		}
		expandedRanks = next;
	}

	const stageDots = [1, 2, 3, 4, 5];

	const baseRankOrder = ['Rookie', 'Challenger', 'Professional', 'Elite', 'Trackmaster', 'Warrior', 'Champion'];
	const baseRankColors: Record<string, string> = {
		Rookie: 'text-gray-800',
		Challenger: 'text-[#cd7f32]',
		Professional: 'text-[#9a9a9a]',
		Elite: 'text-[#d4a000]',
		Trackmaster: 'text-[#14b583]',
		Warrior: 'text-blue-600',
		Champion: 'text-[#9c0026]'
	};
	const baseRankBg: Record<string, string> = {
		Rookie: 'bg-gray-500',
		Challenger: 'bg-[#cd7f32]',
		Professional: 'bg-[#9a9a9a]',
		Elite: 'bg-[#d4a000]',
		Trackmaster: 'bg-[#14b583]',
		Warrior: 'bg-blue-600',
		Champion: 'bg-[#9c0026]'
	};
</script>

{#if isModalOpen}
	<div
		role="button"
		tabindex="0"
		onmousedown={closeModal}
		aria-label="Close ranks info"
		class="fixed inset-0 top-0 right-0 left-0 z-50 flex w-full justify-center overflow-x-hidden overflow-y-auto bg-slate-900/75 md:h-full"
	>
		<div class="relative w-full max-w-lg sm:pt-8">
			<div
				class="relative rounded-tl-3xl rounded-br-3xl bg-white p-6 shadow"
				role="button"
				tabindex="0"
				aria-label="Do not close modal"
				onmousedowncapture={(event) => event.stopPropagation()}
			>
				<div class="flex items-start justify-between">
					<h3 class="text-xl font-bold text-gray-900">Ranks</h3>
					<button
						aria-label="Close modal"
						onclick={closeModal}
						type="button"
						class="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900"
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

				<p class="mb-4 text-sm text-gray-500">
					Advance through 7 base ranks, each with 5 stages. Earn score by collecting medals to climb
					higher.
				</p>

				<div class="space-y-2">
					{#each baseRankOrder as baseRank}
						{@const tiers = RANKS.filter((r) => r.baseRank === baseRank)}
						{@const isCurrentBase = rank.current.baseRank === baseRank}
						{@const isExpanded = expandedRanks.has(baseRank)}
						<div
							class="rounded-xl border border-gray-100 bg-gray-50"
						>
							<button
								type="button"
								onclick={() => toggleRank(baseRank)}
								class="flex w-full items-center justify-between p-3"
							>
								<div class="flex items-center gap-2">
									<div class="h-3 w-3 rounded-full {baseRankBg[baseRank]}"></div>
									<h4 class="text-sm font-bold {baseRankColors[baseRank]}">{baseRank}</h4>
								</div>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 text-gray-400 transition-transform {isExpanded ? 'rotate-180' : ''}"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
								</svg>
							</button>
							{#if isExpanded}
								<div class="grid grid-cols-5 gap-2 px-3 pb-3">
									{#each tiers as tier}
										{@const isCurrent = rank.current.name === tier.name}
										{@const isPassed = score >= tier.threshold}
										<div
											class="rounded-lg border border-gray-200 px-2 py-2 text-center text-xs font-bold"
											class:bg-author-500={isCurrent}
											class:text-white={isCurrent}
											class:bg-white={!isCurrent}
											class:text-gray-400={!isCurrent && !isPassed}
											class:text-gray-900={!isCurrent && isPassed}
										>
											{tier.stage}
											<div class="text-[10px] font-normal">
												{tier.threshold.toLocaleString()}
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}

<div
	class="relative flex h-full flex-col justify-between rounded-tl-3xl rounded-br-3xl border border-gray-200 bg-white p-5"
>
	<button
		onclick={openModal}
		aria-label="View all ranks"
		class="absolute top-5 right-5 rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-5 w-5"
			viewBox="0 0 20 20"
			fill="currentColor"
		>
			<path
				fill-rule="evenodd"
				d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
				clip-rule="evenodd"
			/>
		</svg>
	</button>

	<div>
		<p class="text-xs font-bold tracking-wide text-gray-500 uppercase">Current Rank</p>
		<div class="mt-1 flex items-baseline gap-2">
			<h2 class="text-2xl font-bold text-gray-900">{rank.current.baseRank}</h2>
			<span class="text-author-600 text-3xl font-bold">{rank.current.stage}</span>
		</div>
		<div class="mt-2 flex flex-row gap-8 w-full justify-between">
			<div>
				<p class="text-3xl font-bold text-gray-900">
					{Math.round(completionPercent * 100)}<span class="text-2xl">%</span>
				</p>
				<p class="text-xs text-gray-500">Total Completion</p>
			</div>
			<div>
				<p class="text-3xl font-bold text-gray-900 text-end">{score.toLocaleString()}</p>
				<p class="text-xs text-gray-500 text-end">Points</p>
			</div>
		</div>
	</div>

	<div>
	<div class="mt-3 flex gap-1">
		{#each stageDots as dot}
			<div
				class="h-1.5 flex-1 rounded-full"
				class:bg-author-500={dot <= rank.current.stage}
				class:bg-gray-200={dot > rank.current.stage}
			></div>
		{/each}
	</div>
		<div class="mt-3">
			<ProgressBar value={rank.progress} max={1} color="author" height="h-2" showLabel={false} />
			{#if rank.next}
				<div class="mt-2 flex items-center justify-between">
					<span class="text-xs text-gray-500">Next: {rank.next.name}</span>
					<span class="text-xs font-medium text-gray-900">
						{rank.pointsToNext.toLocaleString()} pts needed
					</span>
				</div>
			{:else}
				<div class="text-author-600 mt-2 text-xs font-medium">Maximum rank reached!</div>
			{/if}
		</div>

	</div>
</div>
