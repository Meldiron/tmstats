<script lang="ts">
	import Card from '$lib/card.svelte';
	import { sync } from '$lib/sync.svelte';
	import SkeletonCard from '$lib/gamify/SkeletonCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<div class="mt-6 grid grid-cols-12 gap-6">
	{#await data.weeks}
		{#each Array(9) as _}
			<SkeletonCard />
		{/each}
	{:then weeks}
		{#each weeks as week (week.uid)}
			<Card
				canSynchronize={data.user && data.user.$id === data.profile.$id}
				onSync={async () => {
					return await sync.start('shorts', {
						year: +week.uid.split('-')[1],
						week: +week.uid.split('-')[0]
					});
				}}
				medalType="shorts"
				maps={week.maps}
				title={`Week ${week.uid.split('-')[0]}`}
				subtitle={`Year ${week.uid.split('-')[1]}`}
				medals={data.profile.medals}
			/>
		{/each}
	{/await}
</div>
