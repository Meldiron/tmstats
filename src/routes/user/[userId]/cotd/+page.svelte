<script lang="ts">
	import { AppwriteService } from '$lib/appwrite';
	import Card from '$lib/card.svelte';
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
	{#each data.months as month (month.uid)}
		<Card
			nadeoAction={async () => {
				return await AppwriteService.nadeoAction(
					data.profile.$id,
					'cotd',
					+month.uid.split('-')[1],
					+month.uid.split('-')[0]
				);
			}}
			medalType="cotd"
			maps={month.maps}
			title={`${monthNames[Number(month.uid.split('-')[0]) - 1]} ${month.uid.split('-')[1]}`}
			subtitle=""
			medals={data.profile.medals}
		/>
	{/each}
</div>
