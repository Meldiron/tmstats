<script>
	import ProgressBar from './ProgressBar.svelte';
	let { level, dark = false } = $props();

	const textMain = dark ? 'text-white' : 'text-gray-900';
	const textSub = dark ? 'text-gray-400' : 'text-gray-500';
	const circleBg = dark ? 'bg-author-900/30' : 'bg-author-100';
	const circleText = dark ? 'text-author-300' : 'text-author-800';
	const circleBorder = dark ? 'border-author-600' : 'border-author-300';
</script>

<div class="flex items-center gap-3">
	<div
		class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 {circleBorder} {circleBg} text-lg font-bold {circleText}"
	>
		{level.level}
	</div>
	<div class="flex-1">
		<div class="mb-1 flex items-baseline justify-between">
			<span class="text-sm font-bold {textMain}">Driver Level</span>
			<span class="text-xs {textSub}"
				>{level.currentXp.toLocaleString()} / {level.targetXp.toLocaleString()} XP</span
			>
		</div>
		<ProgressBar
			value={level.currentXp}
			max={level.targetXp}
			color="author"
			height="h-2.5"
			showLabel={false}
		/>
	</div>
</div>
