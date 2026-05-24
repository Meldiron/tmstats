<script lang="ts">
	import SegmentedBar from '$lib/gamify/SegmentedBar.svelte';
	import RankBadge from '$lib/gamify/RankBadge.svelte';
	import { getRank } from '$lib/gamify/gamification';
	import type { AppwriteProfile } from '$lib/appwrite';
	import { flags } from '$lib/flags.svelte';

	interface Props {
		record: AppwriteProfile;
		index: number;
	}

	let { record, index }: Props = $props();

	const rank = index + 1;
	const warrior = $derived(flags.warriorMedals ? (record.warrior ?? 0) : 0);
	const totalMedals = $derived(
		warrior + record.author + record.gold + record.silver + record.bronze
	);
	const rankInfo = getRank(record.score);

	const rankTextClass: Record<number, string> = {
		1: 'text-gold-600',
		2: 'text-silver-600',
		3: 'text-bronze-600'
	};

	const rankBorderClass: Record<number, string> = {
		1: 'border-l-gold-400',
		2: 'border-l-silver-400',
		3: 'border-l-bronze-400'
	};

	const segments = $derived(
		[
			flags.warriorMedals
				? { label: 'Warrior', count: warrior, color: 'bg-warrior-500' }
				: null,
			{ label: 'Author', count: record.author, color: 'bg-[#14b583]' },
			{ label: 'Gold', count: record.gold, color: 'bg-[#ffd700]' },
			{ label: 'Silver', count: record.silver, color: 'bg-[#c8c8c8]' },
			{ label: 'Bronze', count: record.bronze, color: 'bg-[#cd7f32]' }
		].filter((s): s is { label: string; count: number; color: string } => s !== null)
	);

	function pct(count: number) {
		return totalMedals > 0 ? Math.round((count / totalMedals) * 100) : 0;
	}
</script>

<a
	href={'/user/' + record.$id + '/'}
	class="group block transition-colors hover:bg-gray-50"
>
	<div
		class="flex flex-col gap-3 border-l-4 py-4 px-4 md:flex-row md:items-center md:gap-5 {rank <= 3 ? rankBorderClass[rank] : 'border-l-gray-200'}"
	>
		<!-- Rank + Player Info -->
		<div class="flex items-center gap-3 md:w-[240px] lg:w-[300px] md:shrink-0">
			<div class="w-10 text-center md:w-12">
				{#if rank <= 3}
					<span class="text-2xl font-extrabold {rankTextClass[rank] || 'text-gray-400'}">{rank}</span>
				{:else}
					<span class="text-lg font-bold text-gray-400">{rank}</span>
				{/if}
			</div>
			<div class="min-w-0 flex-1">
				<div class="flex items-center gap-2">
					<span class="truncate text-base font-bold text-gray-900">{record.nickname}</span>
				</div>
				<div class="mt-1 flex flex-wrap items-center gap-2">
					<RankBadge rank={rankInfo} />
					<span class="text-xs font-semibold text-gray-500">{record.score.toLocaleString()} pts</span>
				</div>
			</div>
		</div>

		<!-- Medal Distribution Bar + Legend -->
		<div class="min-w-0 flex-1">
			<SegmentedBar
				warrior={warrior}
				author={record.author}
				gold={record.gold}
				silver={record.silver}
				bronze={record.bronze}
				total={totalMedals}
				height="h-2"
			/>
			<div class="mt-2 flex flex-wrap gap-x-3 gap-y-1">
				{#each segments as seg}
					<div class="flex items-center gap-1.5 text-[11px]">
						<div class="h-2.5 w-2.5 rounded-sm {seg.color}"></div>
						<span class="font-medium text-gray-600">{seg.label}</span>
						<span class="font-bold text-gray-900">{seg.count}</span>
						<span class="text-gray-400">({pct(seg.count)}%)</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Arrow -->
		<div class="hidden items-center justify-end md:flex md:w-12 md:shrink-0">
			<div
				class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors group-hover:bg-author-500 group-hover:text-white"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 transition-transform group-hover:translate-x-0.5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2.5"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
				</svg>
			</div>
		</div>
	</div>
</a>
