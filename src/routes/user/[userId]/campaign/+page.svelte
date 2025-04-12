<script lang="ts">
	import { AppwriteService } from '$lib/appwrite';
	import Card from '$lib/card.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<div class="mt-6 grid grid-cols-12 gap-6">
	{#each data.campaigns as campaign (campaign.uid)}
		{@const season = campaign.uid.split('-')[0]}
		<Card
			nadeoAction={async () => {
				return await AppwriteService.nadeoAction(
					data.profile.$id,
					'campaign',
					undefined,
					undefined,
					undefined,
					campaign.uid
				);
			}}
			medalType="campaign"
			maps={campaign.maps}
			title={`${String(season).charAt(0).toUpperCase()}${String(season).slice(1)} ${campaign.uid.split('-')[1]}`}
			subtitle=""
			medals={data.profile.medals}
		/>
	{/each}
</div>
