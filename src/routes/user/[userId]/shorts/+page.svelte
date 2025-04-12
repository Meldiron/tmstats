<script lang="ts">
	import { AppwriteService } from '$lib/appwrite';
	import Card from '$lib/card.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<div class="mt-6 grid grid-cols-12 gap-6">
	{#each data.weeks as week (week.uid)}
		<Card
			canSynchronize={data.user &&
			(data.user.$id === data.profile.$id ||
				data.user.$id === '06e99ad3-cded-4440-a19c-b3df4fda8004')
				? true
				: false}
			nadeoAction={async () => {
				return await AppwriteService.nadeoAction(
					data.profile.$id,
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
</div>
