<script lang="ts">
	import ProgressBar from './ProgressBar.svelte';
	import type { Milestone } from './gamification';
	interface Props {
		milestone: Milestone;
	}
	let { milestone }: Props = $props();
</script>

<div class="rounded-tl-3xl rounded-br-3xl border border-gray-200 bg-white p-4">
	<div class="mb-2 flex items-start justify-between">
		<div>
			<h4 class="text-sm font-bold text-gray-900">{milestone.label}</h4>
			<p class="text-xs text-gray-500">
				{milestone.current.toLocaleString()} / {milestone.target.toLocaleString()}
				{milestone.unit}
			</p>
		</div>
		{#if milestone.category}
			<span
				class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600 uppercase"
			>
				{milestone.category === 'totd'
					? 'Track of the day'
					: milestone.category === 'shorts'
						? 'Shorts'
						: 'Campaign'}
			</span>
		{/if}
	</div>
	<ProgressBar
		value={milestone.current}
		max={milestone.target}
		color="author"
		height="h-2.5"
		showLabel={false}
	/>
</div>
