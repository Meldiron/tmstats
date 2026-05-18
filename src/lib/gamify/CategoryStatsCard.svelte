<script lang="ts">
	import ProgressBar from './ProgressBar.svelte';
	import type { CategoryStats } from './gamification';
	interface Props {
		category: 'cotd' | 'shorts' | 'campaign';
		stats: CategoryStats;
	}
	let { category, stats }: Props = $props();

	const catLabel: Record<string, string> = {
		cotd: 'Track of the Day',
		shorts: 'Weekly Shorts',
		campaign: 'Campaign'
	};

	const medalColors: Record<string, string> = {
		author: 'text-author-600',
		gold: 'text-gold-600',
		silver: 'text-silver-600',
		bronze: 'text-bronze-600'
	};
</script>

<div class="rounded-tl-3xl rounded-br-3xl border border-gray-200 bg-white p-4">
	<div class="mb-3 flex items-center justify-between">
		<h3 class="text-lg font-bold text-gray-900">{catLabel[category] || category}</h3>
		<span class="text-2xl font-bold text-gray-900"
			>{Math.round(stats.completionPercent * 100)}%</span
		>
	</div>

	<ProgressBar
		value={stats.completedMaps}
		max={stats.totalMaps}
		color="author"
		height="h-3"
		showLabel={false}
	/>

	<div class="mt-3 grid grid-cols-4 gap-2 text-center">
		<div class="bg-author-50 rounded-lg py-2">
			<p class="text-lg font-bold {medalColors.author}">{stats.author}</p>
			<p class="text-[10px] font-medium text-gray-500 uppercase">Author</p>
		</div>
		<div class="bg-gold-50 rounded-lg py-2">
			<p class="text-lg font-bold {medalColors.gold}">{stats.gold}</p>
			<p class="text-[10px] font-medium text-gray-500 uppercase">Gold</p>
		</div>
		<div class="bg-silver-50 rounded-lg py-2">
			<p class="text-lg font-bold {medalColors.silver}">{stats.silver}</p>
			<p class="text-[10px] font-medium text-gray-500 uppercase">Silver</p>
		</div>
		<div class="bg-bronze-50 rounded-lg py-2">
			<p class="text-lg font-bold {medalColors.bronze}">{stats.bronze}</p>
			<p class="text-[10px] font-medium text-gray-500 uppercase">Bronze</p>
		</div>
	</div>

	<div class="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
		<div class="text-center">
			<p class="text-xs text-gray-500">Completed</p>
			<p class="text-sm font-bold text-gray-900">
				{stats.completedMaps} <span class="font-normal text-gray-400">/ {stats.totalMaps}</span>
			</p>
		</div>
		<div class="text-center">
			<p class="text-xs text-gray-500">Finished Groups</p>
			<p class="text-sm font-bold text-gray-900">{stats.finishedGroups}</p>
		</div>
		<div class="text-center">
			<p class="text-xs text-gray-500">Score</p>
			<p class="text-sm font-bold text-gray-900">{stats.score.toLocaleString()}</p>
		</div>
	</div>
</div>
