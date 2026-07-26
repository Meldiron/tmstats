<script lang="ts">
	import Card from '$lib/card.svelte';
	import { sync } from '$lib/sync.svelte';
	import SkeletonCard from '$lib/gamify/SkeletonCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<div class="mt-6 grid grid-cols-12 gap-6">
	{#await data.campaigns}
		{#each Array(9) as _}
			<SkeletonCard />
		{/each}
	{:then campaigns}
		{#each campaigns as campaign (campaign.uid)}
			{@const season = campaign.uid.split('-')[0]}
			<Card
				canSynchronize={data.user && data.user.$id === data.profile.$id}
				onSync={async () => {
					return await sync.start('campaign', { campaignUid: campaign.uid });
				}}
				medalType="campaign"
				maps={campaign.maps}
				title={`${String(season).charAt(0).toUpperCase()}${String(season).slice(1)} ${campaign.uid.split('-')[1]}`}
				subtitle=""
				medals={data.profile.medals}
			/>
		{/each}
	{/await}
</div>
