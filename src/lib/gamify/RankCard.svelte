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

	const stageDots = [1, 2, 3, 4, 5];

	const baseRankOrder = ['Rookie', 'Challenger', 'Professional', 'Elite', 'Trackmaster'];
	const baseRankColors: Record<string, string> = {
		Rookie: 'text-gray-800',
		Challenger: 'text-bronze-600',
		Professional: 'text-silver-600',
		Elite: 'text-gold-600',
		Trackmaster: 'text-author-600'
	};
	const baseRankBg: Record<string, string> = {
		Rookie: 'bg-gray-500',
		Challenger: 'bg-bronze-500',
		Professional: 'bg-silver-500',
		Elite: 'bg-gold-500',
		Trackmaster: 'bg-author-500'
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
					Advance through 5 base ranks, each with 5 stages. Earn score by collecting medals to climb
					higher.
				</p>

				<div class="space-y-4">
					{#each baseRankOrder as baseRank}
						{@const tiers = RANKS.filter((r) => r.baseRank === baseRank)}
						{@const isCurrentBase = rank.current.baseRank === baseRank}
						<div
							class="rounded-xl border border-gray-100 bg-gray-50 p-3"
							class:ring-2={isCurrentBase}
							class:ring-author-300={isCurrentBase}
						>
							<div class="mb-2 flex items-center gap-2">
								<div class="h-3 w-3 rounded-full {baseRankBg[baseRank]}"></div>
								<h4 class="text-sm font-bold {baseRankColors[baseRank]}">{baseRank}</h4>
							</div>
							<div class="grid grid-cols-5 gap-2">
								{#each tiers as tier}
									{@const isCurrent = rank.current.name === tier.name}
									{@const isPassed = score >= tier.threshold}
									<div
										class="rounded-lg border px-2 py-2 text-center text-xs font-bold"
										class:bg-author-500={isCurrent}
										class:text-white={isCurrent}
										class:bg-white={!isCurrent}
										class:text-gray-400={!isCurrent && !isPassed}
										class:text-gray-900={!isCurrent && isPassed}
										class:border-author-300={isCurrent}
										class:border-gray-200={!isCurrent}
									>
										{tier.stage}
										<div class="text-[10px] font-normal">
											{tier.threshold.toLocaleString()}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}

<div
	class="flex h-full flex-col justify-between rounded-tl-3xl rounded-br-3xl border border-gray-200 bg-white p-5"
>
	<div class="flex items-start justify-between">
		<div class="flex-1">
			<p class="text-xs font-bold tracking-wide text-gray-500 uppercase">Current Rank</p>
			<div class="mt-1 flex items-baseline gap-2">
				<h2 class="text-2xl font-bold text-gray-900">{rank.current.baseRank}</h2>
				<span class="text-author-600 text-3xl font-bold">{rank.current.stage}</span>
			</div>
			<div class="mt-2">
				<p class="text-4xl font-bold text-gray-900">
					{Math.round(completionPercent * 100)}<span class="text-2xl">%</span>
				</p>
				<p class="text-xs text-gray-500">Total Completion</p>
			</div>
		</div>
		<button
			onclick={openModal}
			aria-label="View all ranks"
			class="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
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
	</div>

	<div>
		<div class="mt-3">
			<div class="mb-1 flex items-baseline justify-between">
				<span class="text-sm font-bold text-gray-900">{rank.current.name}</span>
				<span class="text-sm text-gray-500">{score.toLocaleString()} pts</span>
			</div>
			<ProgressBar value={rank.progress} max={1} color="author" height="h-3" showLabel={false} />
			{#if rank.next}
				<div class="mt-1 flex items-center justify-between">
					<span class="text-xs text-gray-500">Next: {rank.next.name}</span>
					<span class="text-xs font-medium text-gray-900">
						{rank.pointsToNext.toLocaleString()} pts needed
					</span>
				</div>
			{:else}
				<div class="text-author-600 mt-1 text-xs font-medium">Maximum rank reached!</div>
			{/if}
		</div>

		<div class="mt-3 flex gap-1">
			{#each stageDots as dot}
				<div
					class="h-1.5 flex-1 rounded-full"
					class:bg-author-500={dot <= rank.current.stage}
					class:bg-gray-200={dot > rank.current.stage}
				></div>
			{/each}
		</div>
	</div>
</div>
