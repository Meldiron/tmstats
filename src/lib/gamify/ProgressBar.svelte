<script lang="ts">
	interface Props {
		value?: number;
		max?: number;
		color?:
			| 'warrior'
			| 'author'
			| 'gold'
			| 'silver'
			| 'bronze'
			| 'blue'
			| 'purple'
			| 'orange'
			| 'gray'
			| 'red'
			| 'teal';
		height?: string;
		showLabel?: boolean;
		label?: string;
		sublabel?: string;
		class?: string;
	}

	let {
		value = 0,
		max = 100,
		color = 'author',
		height = 'h-3',
		showLabel = true,
		label = '',
		sublabel = '',
		class: className = ''
	}: Props = $props();

	const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

	const colorClasses: Record<string, string> = {
		warrior: 'bg-warrior-500',
		author: 'bg-author-500',
		gold: 'bg-gold-500',
		silver: 'bg-silver-400',
		bronze: 'bg-bronze-500',
		blue: 'bg-blue-500',
		purple: 'bg-purple-500',
		orange: 'bg-orange-500',
		gray: 'bg-gray-500',
		red: 'bg-red-500',
		teal: 'bg-teal-500'
	};

	const bgClasses: Record<string, string> = {
		warrior: 'bg-warrior-100',
		author: 'bg-author-100',
		gold: 'bg-gold-100',
		silver: 'bg-silver-100',
		bronze: 'bg-bronze-100',
		blue: 'bg-blue-100',
		purple: 'bg-purple-100',
		orange: 'bg-orange-100',
		gray: 'bg-gray-100',
		red: 'bg-red-100',
		teal: 'bg-teal-100'
	};
</script>

<div class="w-full {className}">
	{#if showLabel}
		<div class="mb-1 flex items-baseline justify-between">
			<span class="text-sm font-medium text-gray-700">{label}</span>
			<span class="text-sm font-bold text-gray-900">
				{Math.round(pct)}%
				{#if sublabel}
					<span class="font-normal text-gray-500">({sublabel})</span>
				{/if}
			</span>
		</div>
	{/if}
	<div class="w-full overflow-hidden rounded-full {bgClasses[color] || bgClasses.gray} {height}">
		<div
			class="{colorClasses[color] ||
				colorClasses.author} {height} rounded-full transition-all duration-700 ease-out"
			style="width: {pct}%"
		></div>
	</div>
</div>
