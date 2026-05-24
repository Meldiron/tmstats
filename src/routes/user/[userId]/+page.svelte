<script lang="ts">
	import { computeGamification } from '$lib/gamify/gamification';
	import ProgressBar from '$lib/gamify/ProgressBar.svelte';
	import SegmentedBar from '$lib/gamify/SegmentedBar.svelte';
	import RankCard from '$lib/gamify/RankCard.svelte';
	import CategoryStatsCard from '$lib/gamify/CategoryStatsCard.svelte';
	import MedalDistribution from '$lib/gamify/MedalDistribution.svelte';
	import SkeletonOverview from '$lib/gamify/SkeletonOverview.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

{#await data.gamifyData}
	<SkeletonOverview />
{:then gamifyData}
	{@const g = computeGamification(
		data.profile,
		gamifyData.dailyMaps,
		gamifyData.weeklyMaps,
		gamifyData.campaignMaps,
		gamifyData.weeklyGrandMaps
	)}

	<div class="mt-6 space-y-6">
		<!-- Hero Stats Row -->
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
			<!-- Rank Card -->
			<RankCard
				rank={g.rank}
				score={g.overall.score}
				completionPercent={g.overall.completionPercent}
			/>

			<!-- Total Completion -->
			<div class="rounded-tl-3xl rounded-br-3xl border border-gray-200 bg-white p-5">
				<div class="flex h-full flex-col justify-between space-y-3">
					<h3 class="text-lg font-bold text-gray-900">Total Completion</h3>

					<div class="flex flex-col justify-between space-y-3">    
    					<!-- Silver+ -->
    					<div>
    						<div class="mb-1 flex items-center justify-between text-xs">
    							<div class="flex items-center gap-1.5">
    								<div class="bg-silver-400 h-2.5 w-2.5 rounded-full"></div>
    								<span class="font-medium text-gray-700">Silver or higher</span>
    							</div>
    							<span class="font-bold text-gray-900">
    								{g.overall.silverPlus}
    								<span class="font-normal text-gray-400">/ {g.overall.totalMaps}</span>
    								<span class="text-author-600 ml-1"
    									>{Math.round((g.overall.silverPlus / g.overall.totalMaps) * 100)}%</span
    								>
    							</span>
    						</div>
    						<ProgressBar
    							value={g.overall.silverPlus}
    							max={g.overall.totalMaps}
    							color="silver"
    							height="h-2"
    							showLabel={false}
    						/>
    					</div>
    
    					<!-- Gold+ -->
    					<div>
    						<div class="mb-1 flex items-center justify-between text-xs">
    							<div class="flex items-center gap-1.5">
    								<div class="h-2.5 w-2.5 rounded-full bg-[#ffd700]"></div>
    								<span class="font-medium text-gray-700">Gold or higher</span>
    							</div>
    							<span class="font-bold text-gray-900">
    								{g.overall.goldPlus}
    								<span class="font-normal text-gray-400">/ {g.overall.totalMaps}</span>
    								<span class="text-author-600 ml-1"
    									>{Math.round((g.overall.goldPlus / g.overall.totalMaps) * 100)}%</span
    								>
    							</span>
    						</div>
    						<ProgressBar
    							value={g.overall.goldPlus}
    							max={g.overall.totalMaps}
    							color="gold"
    							height="h-2"
    							showLabel={false}
    						/>
    					</div>
    
    					<!-- Author -->
    					<div>
    						<div class="mb-1 flex items-center justify-between text-xs">
    							<div class="flex items-center gap-1.5">
    								<div class="h-2.5 w-2.5 rounded-full bg-[#14b583]"></div>
    								<span class="font-medium text-gray-700">Author or higher</span>
    							</div>
    							<span class="font-bold text-gray-900">
    								{g.overall.author}
    								<span class="font-normal text-gray-400">/ {g.overall.totalMaps}</span>
    								<span class="text-author-600 ml-1"
    									>{Math.round((g.overall.author / g.overall.totalMaps) * 100)}%</span
    								>
    							</span>
    						</div>
    						<ProgressBar
    							value={g.overall.author}
    							max={g.overall.totalMaps}
    							color="author"
    							height="h-2"
    							showLabel={false}
    						/>
    					</div>

    					<!-- Warrior or higher -->
    					<div>
    						<div class="mb-1 flex items-center justify-between text-xs">
    							<div class="flex items-center gap-1.5">
    								<div class="h-2.5 w-2.5 rounded-full bg-warrior-500"></div>
    								<span class="font-medium text-gray-700">Warrior or higher</span>
    							</div>
    							<span class="font-bold text-gray-900">
    								{g.overall.warrior}
    								<span class="font-normal text-gray-400">/ {g.overall.totalMaps}</span>
    								<span class="text-author-600 ml-1"
    									>{Math.round((g.overall.warrior / g.overall.totalMaps) * 100)}%</span
    								>
    							</span>
    						</div>
    						<ProgressBar
    							value={g.overall.warrior}
    							max={g.overall.totalMaps}
    							color="warrior"
    							height="h-2"
    							showLabel={false}
    						/>
    					</div>
					</div>
				</div>
			</div>

			<CategoryStatsCard category="campaign" stats={g.categories.campaign} />
		</div>

		<!-- Category Mastery -->
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<CategoryStatsCard category="totd" stats={g.categories.totd} />
			<CategoryStatsCard category="shorts" stats={g.categories.shorts} />
			<CategoryStatsCard category="grands" stats={g.categories.grands} />
		</div>

		<!-- Medal Distribution -->
		<MedalDistribution overall={g.overall} />

		<!-- Unfinished Business -->
		{#if g.insights.unfinishedBusiness.length > 0}
			<div>
				<h3 class="mb-3 text-xl font-bold text-gray-900">Unfinished Business</h3>
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{#each g.insights.unfinishedBusiness as group}
						<div class="rounded-tl-3xl rounded-br-3xl border border-gray-200 bg-white p-4">
							<div class="mb-2 flex items-center justify-between">
								<h4 class="text-sm font-bold text-gray-900">{group.name}</h4>
								<span
									class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600 uppercase"
								>
								{group.category === 'cotd' || group.category === 'totd'
									? 'Track of the day'
									: group.category === 'shorts'
										? 'Shorts'
										: group.category === 'grand' || group.category === 'grands'
											? 'Grands'
											: 'Campaign'}
								</span>
							</div>
							<div class="mb-1 flex justify-between text-xs text-gray-500">
								<span>{group.completedCount} / {group.totalCount} maps</span>
								<span>{Math.floor((group.completedCount / group.totalCount) * 100)}%</span>
							</div>
							<SegmentedBar
								warrior={group.warriorCount}
								author={group.authorCount}
								gold={group.goldCount}
								silver={group.silverCount}
								bronze={group.bronzeCount}
								total={group.totalCount}
								height="h-2"
							/>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/await}
