<script lang="ts">
	import SegmentedBar from './SegmentedBar.svelte';
	import { flags } from '$lib/flags.svelte';
	import type { CategoryStats } from './gamification';
	interface Props {
		category: 'totd' | 'shorts' | 'grands' | 'campaign';
		stats: CategoryStats;
	}
	let { category, stats }: Props = $props();

	const catLabel: Record<string, string> = {
		totd: 'Track of the Day',
		shorts: 'Weekly Shorts',
		grands: 'Weekly Grands',
		campaign: 'Campaign'
	};

	const medalColors: Record<string, string> = {
		champion: 'text-champion-700',
		warrior: 'text-warrior-600',
		author: 'text-author-600',
		gold: 'text-gold-600',
		silver: 'text-silver-600',
		bronze: 'text-bronze-600'
	};
</script>

<div class="flex flex-col rounded-tl-3xl rounded-br-3xl border border-gray-200 bg-white p-4">
	<div class="mb-3 flex items-center justify-between">
		<h3 class="text-lg font-bold text-gray-900">{catLabel[category] || category}</h3>
		<span class="text-2xl font-bold text-gray-900"
			>{Math.round(stats.completionPercent * 100)}%</span
		>
	</div>

	<div class="flex-1"></div>

	<div class="mb-3 grid {flags.warriorMedals ? 'grid-cols-5' : 'grid-cols-4'} gap-2 text-center">
    	{#if flags.warriorMedals}
    		<div class="bg-warrior-50 rounded-lg py-2">
    			<p class="text-lg font-bold {medalColors.warrior}">{stats.warrior}</p>
    			<p class="text-[8px] font-medium text-gray-500 uppercase">Warrior</p>
    		</div>
    	{/if}
		<div class="bg-author-50 rounded-lg py-2">
			<p class="text-lg font-bold {medalColors.author}">{stats.author + (flags.warriorMedals ? 0 : stats.warrior)}</p>
			<p class="text-[8px] font-medium text-gray-500 uppercase">Author</p>
		</div>
		<div class="bg-gold-50 rounded-lg py-2">
			<p class="text-lg font-bold {medalColors.gold}">{stats.gold}</p>
			<p class="text-[8px] font-medium text-gray-500 uppercase">Gold</p>
		</div>
		<div class="bg-silver-50 rounded-lg py-2">
			<p class="text-lg font-bold {medalColors.silver}">{stats.silver}</p>
			<p class="text-[8px] font-medium text-gray-500 uppercase">Silver</p>
		</div>
		<div class="bg-bronze-50 rounded-lg py-2">
			<p class="text-lg font-bold {medalColors.bronze}">{stats.bronze}</p>
			<p class="text-[8px] font-medium text-gray-500 uppercase">Bronze</p>
		</div>
	</div>

	<div class="flex items-center justify-between border-t border-gray-100 pt-3">
		<div class="text-center">
			<p class="text-xs text-gray-500">Completed</p>
			<p class="text-sm font-bold text-gray-900">
				{stats.completedMaps} <span class="font-normal text-gray-400">/ {stats.totalMaps}</span>
			</p>
		</div>
		<div class="text-center">
			<p class="text-xs text-gray-500">Finished Groups</p>
			<p class="text-sm font-bold text-gray-900">
				{stats.finishedGroups} <span class="font-normal text-gray-400">/ {stats.totalGroups}</span>
			</p>
		</div>
		<div class="text-center">
			<p class="text-xs text-gray-500">Score</p>
			<p class="text-sm font-bold text-gray-900">{stats.score.toLocaleString()}</p>
		</div>
	</div>

	<div class="mt-3">
		<SegmentedBar
			warrior={flags.warriorMedals ? stats.warrior : 0}
			author={stats.author + (flags.warriorMedals ? 0 : stats.warrior)}
			gold={stats.gold}
			silver={stats.silver}
			bronze={stats.bronze}
			total={stats.totalMaps}
			height="h-3"
		/>
	</div>
</div>
