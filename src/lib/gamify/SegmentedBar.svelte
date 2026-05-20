<script lang="ts">
	interface Props {
		author: number;
		gold: number;
		silver: number;
		bronze: number;
		total: number;
		height?: string;
	}
	let { author, gold, silver, bronze, total, height = 'h-2' }: Props = $props();

	const noMedal = Math.max(0, total - author - gold - silver - bronze);

	const segments = [
		{ count: author, color: 'bg-[#14b583]' },
		{ count: gold, color: 'bg-[#ffd700]' },
		{ count: silver, color: 'bg-[#e0e0e0]' },
		{ count: bronze, color: 'bg-[#cd7f32]' },
		{ count: noMedal, color: 'bg-gray-700' }
	];

	function pct(count: number) {
		return total > 0 ? Math.round((count / total) * 100) : 0;
	}
</script>

<div class="flex w-full overflow-hidden rounded-full {height}">
	{#each segments as seg}
		{#if seg.count > 0}
			<div
				class="{seg.color} h-full transition-all duration-500"
				style="width: {pct(seg.count)}%"
				title="{seg.count} ({pct(seg.count)}%)"
			></div>
		{/if}
	{/each}
</div>
