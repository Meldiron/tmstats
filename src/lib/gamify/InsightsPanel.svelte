<script lang="ts">
	import type { CategoryStats, MapGroup } from './gamification';
	interface InsightCategory extends CategoryStats {
		id: string;
	}
	interface Props {
		insights: {
			bestCategory: InsightCategory;
			worstCategory: InsightCategory;
			unfinishedBusiness: MapGroup[];
		};
		finishedGroups: { label: string; count: number; total: number }[];
	}
	let { insights, finishedGroups }: Props = $props();

	const catNames: Record<string, string> = {
		totd: 'Track of the Day',
		shorts: 'Weekly Shorts',
		campaign: 'Campaign'
	};
</script>

<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
	<!-- Best & Worst Category -->
	<div class="rounded-tl-3xl rounded-br-3xl border border-gray-200 bg-white p-4">
		<h3 class="mb-3 text-lg font-bold text-gray-900">Category Insights</h3>

		<div class="space-y-3">
			<div class="flex items-center gap-3 rounded-xl bg-green-50 p-3">
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div class="flex-1">
					<p class="text-xs text-gray-500">Best Category</p>
					<p class="text-sm font-bold text-gray-900">
						{catNames[insights.bestCategory.id] || insights.bestCategory.id}
					</p>
					<p class="text-xs text-green-700">
						{Math.round(insights.bestCategory.completionPercent * 100)}% completion
					</p>
				</div>
			</div>

			<div class="flex items-center gap-3 rounded-xl bg-orange-50 p-3">
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div class="flex-1">
					<p class="text-xs text-gray-500">Needs Attention</p>
					<p class="text-sm font-bold text-gray-900">
						{catNames[insights.worstCategory.id] || insights.worstCategory.id}
					</p>
					<p class="text-xs text-orange-700">
						{Math.round(insights.worstCategory.completionPercent * 100)}% completion
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Finished Groups -->
	<div class="rounded-tl-3xl rounded-br-3xl border border-gray-200 bg-white p-4">
		<h3 class="mb-3 text-lg font-bold text-gray-900">Finished Groups</h3>
		<div class="space-y-3">
			{#each finishedGroups as pg}
				<div>
					<div class="mb-1 flex justify-between text-sm">
						<span class="font-medium text-gray-700">{pg.label}</span>
						<span class="font-bold text-gray-900"
							>{pg.count} <span class="font-normal text-gray-400">/ {pg.total}</span></span
						>
					</div>
					<div class="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
						<div
							class="bg-author-500 h-full rounded-full transition-all"
							style="width: {pg.total > 0 ? (pg.count / pg.total) * 100 : 0}%"
						></div>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Unfinished Business -->
	{#if insights.unfinishedBusiness.length > 0}
		<div class="rounded-tl-3xl rounded-br-3xl border border-gray-200 bg-white p-4 md:col-span-2">
			<h3 class="mb-3 text-lg font-bold text-gray-900">Unfinished Business</h3>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each insights.unfinishedBusiness as group}
					<div class="rounded-xl border border-gray-100 bg-gray-50 p-3">
						<div class="mb-1 flex items-center justify-between">
							<span class="text-sm font-bold text-gray-900">{group.name}</span>
							<span class="text-xs font-medium text-gray-500">
								{group.category === 'totd'
									? 'Track of the day'
									: group.category === 'shorts'
										? 'Shorts'
										: 'Campaign'}
							</span>
						</div>
						<div class="mb-1 flex justify-between text-xs text-gray-500">
							<span>{group.completedCount} / {group.totalCount} maps</span>
							<span>{Math.floor((group.completedCount / group.totalCount) * 100)}%</span>
						</div>
						<div class="h-2 w-full overflow-hidden rounded-full bg-gray-200">
							<div
								class="bg-author-500 h-full rounded-full transition-all"
								style="width: {(group.completedCount / group.totalCount) * 100}%"
							></div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
