<script lang="ts">
	import Card from '$lib/card.svelte';
	import { sync } from '$lib/sync.svelte';
	import SkeletonCard from '$lib/gamify/SkeletonCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const monthNames = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];
</script>

<div class="mt-6 grid grid-cols-12 gap-6">
	{#await data.months}
		{#each Array(9) as _}
			<SkeletonCard />
		{/each}
	{:then months}
		{#each months as month (month.uid)}
			<Card
				canSynchronize={data.user && data.user.$id === data.profile.$id}
				onSync={async () => {
					return await sync.start('cotd', {
						year: +month.uid.split('-')[1],
						month: +month.uid.split('-')[0]
					});
				}}
				medalType="cotd"
				maps={month.maps}
				title={`${monthNames[Number(month.uid.split('-')[0]) - 1]} ${month.uid.split('-')[1]}`}
				subtitle=""
				medals={data.profile.medals}
			/>
		{/each}
	{/await}
</div>
