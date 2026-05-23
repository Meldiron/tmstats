<script lang="ts">
	interface Props {
		warrior?: number;
		author: number;
		gold: number;
		silver: number;
		bronze: number;
		total: number;
		height?: string;
	}
	let { warrior = 0, author, gold, silver, bronze, total, height = 'h-2' }: Props = $props();

	const noMedal = Math.max(0, total - warrior - author - gold - silver - bronze);

	const segments = [
		{ count: warrior, color: 'bg-warrior-500' },
		{ count: author, color: 'bg-[#14b583]' },
		{ count: gold, color: 'bg-[#ffd700]' },
		{ count: silver, color: 'bg-[#c8c8c8]' },
		{ count: bronze, color: 'bg-[#cd7f32]' },
		{ count: noMedal, color: 'bg-gray-50' }
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
