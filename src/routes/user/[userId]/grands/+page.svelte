<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { AppwriteService } from '$lib/appwrite';
	import Card from '$lib/card.svelte';
	import SkeletonCard from '$lib/gamify/SkeletonCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let syncingYear: number | null = $state(null);
	async function syncYear(year: number) {
		if (syncingYear !== null) return;
		syncingYear = year;
		try {
			await AppwriteService.nadeoAction('grands', year);
			await invalidateAll();
		} finally {
			syncingYear = null;
		}
	}
</script>

<div class="mt-6 grid grid-cols-12 gap-6">
	{#await data.weeks}
		{#each Array(9) as _}
			<SkeletonCard />
		{/each}
	{:then weeks}
		{#each weeks as week, index (week.uid)}
			{@const currentYear = +week.uid.split('-')[1]}
			{@const prevYear = index > 0 ? +weeks[index - 1].uid.split('-')[1] : null}

			{#if currentYear !== prevYear}
				<div class="col-span-12 flex items-center justify-between pb-2 pt-4">
					<h2 class="text-4xl tracking-wide font-bold text-gray-700">{currentYear}</h2>
					{#if data.user && data.user.$id === data.profile.$id}
						<button
							aria-label="Synchronize year"
							disabled={syncingYear === currentYear}
							onclick={() => syncYear(currentYear)}
							class="rounded-tl-2xl rounded-br-2xl bg-gray-700 px-4 py-2 font-bold text-white enabled:hover:bg-gray-600 disabled:opacity-50"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="size-5"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
								/>
							</svg>
						</button>
					{/if}
				</div>
			{/if}

			<Card
				canSynchronize={false}
				medalType="grand"
				maps={week.maps}
				title={`Week ${week.uid.split('-')[0]}`}
				subtitle={`Year ${week.uid.split('-')[1]}`}
				medals={data.profile.medals}
				fullWidth={true}
			/>
		{/each}
	{/await}
</div>
