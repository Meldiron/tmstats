<script lang="ts">
	interface OverallStats {
		totalMaps: number;
		completedMaps: number;
		warrior: number;
		author: number;
		gold: number;
		silver: number;
		bronze: number;
		silverPlus: number;
		goldPlus: number;
	}
	interface Props {
		overall: OverallStats;
	}
	let { overall }: Props = $props();

	const total = overall.warrior + overall.author + overall.gold + overall.silver + overall.bronze;
	const noMedal = overall.totalMaps - overall.completedMaps;

	const segments = [
		{ label: 'Warrior', count: overall.warrior, color: 'bg-warrior-500', text: 'text-warrior-600' },
		{ label: 'Author', count: overall.author, color: 'bg-[#14b583]', text: 'text-[#14b583]' },
		{ label: 'Gold', count: overall.gold, color: 'bg-[#ffd700]', text: 'text-[#ffd700]' },
		{ label: 'Silver', count: overall.silver, color: 'bg-[#c8c8c8]', text: 'text-[#9a9a9a]' },
		{ label: 'Bronze', count: overall.bronze, color: 'bg-[#cd7f32]', text: 'text-[#cd7f32]' },
		{ label: 'No Medal', count: noMedal, color: 'bg-gray-50', text: 'text-gray-500' }
	];

	function pct(count: number) {
		return overall.totalMaps > 0 ? Math.round((count / overall.totalMaps) * 100) : 0;
	}
</script>

<div class="rounded-tl-3xl rounded-br-3xl border border-gray-200 bg-white p-4">
	<div class="mb-3 flex items-baseline justify-between">
		<h3 class="text-lg font-bold text-gray-900">Medal Distribution</h3>
		<div class="text-right">
			<p class="text-2xl font-bold text-gray-900">
				{Math.round((overall.completedMaps / overall.totalMaps) * 100)}%
			</p>
			<p class="text-[10px] font-medium text-gray-500 uppercase">Total Completion</p>
		</div>
	</div>

	<div class="flex h-4 w-full overflow-hidden rounded-full">
		{#each segments as seg}
			{#if seg.count > 0}
				<div
					class="{seg.color} h-full transition-all duration-500"
					style="width: {pct(seg.count)}%"
					title="{seg.label}: {seg.count} ({pct(seg.count)}%)"
				></div>
			{/if}
		{/each}
	</div>

	<div class="mt-3 flex flex-wrap gap-3">
		{#each segments as seg}
			<div class="flex items-center gap-1.5 text-xs">
				<div class="h-3 w-3 rounded-sm {seg.color}"></div>
				<span class="font-medium text-gray-700">{seg.label}</span>
				<span class="font-bold text-gray-900">{seg.count}</span>
				<span class="text-gray-400">({pct(seg.count)}%)</span>
			</div>
		{/each}
	</div>

	<div class="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 sm:grid-cols-3 lg:grid-cols-5">
		<div class="text-center">
			<p class="text-2xl font-bold text-warrior-600">{overall.warrior}</p>
			<p class="text-xs text-gray-500">Warrior Medals</p>
			<p class="text-xs font-medium text-gray-400">{overall.warrior * 20} pts</p>
		</div>
		<div class="text-center">
			<p class="text-2xl font-bold text-[#14b583]">{overall.author}</p>
			<p class="text-xs text-gray-500">Author Medals</p>
			<p class="text-xs font-medium text-gray-400">{overall.author * 12} pts</p>
		</div>
		<div class="text-center">
			<p class="text-2xl font-bold text-[#d19e00]">{overall.gold}</p>
			<p class="text-xs text-gray-500">Gold Medals</p>
			<p class="text-xs font-medium text-gray-400">{overall.gold * 4} pts</p>
		</div>
		<div class="text-center">
			<p class="text-2xl font-bold text-gray-400">{overall.silver}</p>
			<p class="text-xs text-gray-500">Silver Medals</p>
			<p class="text-xs font-medium text-gray-400">{overall.silver * 2} pts</p>
		</div>
		<div class="text-center">
			<p class="text-2xl font-bold text-[#cd7f32]">{overall.bronze}</p>
			<p class="text-xs text-gray-500">Bronze Medals</p>
			<p class="text-xs font-medium text-gray-400">{overall.bronze} pts</p>
		</div>
	</div>
</div>
