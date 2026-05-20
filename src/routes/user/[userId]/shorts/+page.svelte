<script lang="ts">
	import { AppwriteService } from '$lib/appwrite';
	import Card from '$lib/card.svelte';
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
				nadeoAction={async () => {
					return await AppwriteService.nadeoAction(
						'shorts',
						+week.uid.split('-')[1],
						undefined,
						+week.uid.split('-')[0]
					);
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
