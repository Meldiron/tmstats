<script lang="ts">
	import Instructions from '$lib/instructions.svelte';
	import { AppwriteService } from '../../../appwrite';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let profileId;
	page.subscribe(async () => {
		profileId = $page.params.profile;
	});

	let profileName = '...';

	let silver = 0;
	let bronze = 0;
	let gold = 0;
	let author = 0;
	let totalPoints = 0;

	const categories = [
		{ name: 'Track of the day', url: '/cotd/' + new Date().getFullYear(), current: false },
		{ name: 'Weekly shorts', url: '/shorts', current: true },
		{ name: 'Campaign', url: '/campaign', current: false }
	];

	let didFail = null;

	const onMountFunction = async () => {
		let dbRes = await AppwriteService.getHeatmap(profileId);

		if (!dbRes) {
			didFail = true;
			return;
		} else {
			didFail = false;
		}

		silver = dbRes.silver;
		bronze = dbRes.bronze;
		gold = dbRes.gold;
		author = dbRes.author;
		totalPoints = dbRes.score;
		profileName = dbRes.nickname;
	};

	onMount(onMountFunction);
</script>

<div class="max-w-5xl w-full mx-auto mt-6">
	<div
		class="border border-gray-900  flex flex-col space-y-4 sm:flex-row  sm:space-y-0 items-center justify-between rounded-tl-3xl rounded-br-3xl font-bold text-white text-2xl bg-gray-800 p-4"
	>
		<div class="flex items-center justify-start space-x-3">
			<a href="/" class="rounded-full bg-gray-900 p-2">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
						clip-rule="evenodd"
					/>
				</svg>
			</a>

			{#if didFail === null}
				<svg
					class="w-5 h-5 animate-spin"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle
						class="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						stroke-width="4"
					/>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					/>
				</svg>
			{/if}

			<h1>
				{profileName}
				<span class="text-sm uppercase font-normal text-gray-400">{totalPoints} points</span>
			</h1>
		</div>
		<div class="flex items-center justify-center space-x-3">
			<div
				class="w-10 h-10 text-xs flex items-center justify-center rounded-full bg-author-500 text-author-800"
			>
				{author}
			</div>

			<div
				class="w-10 h-10 text-xs flex items-center justify-center rounded-full bg-gold-500 text-gold-800"
			>
				{gold}
			</div>

			<div
				class="w-10 h-10 text-xs flex items-center justify-center rounded-full bg-white text-silver-600"
			>
				{silver}
			</div>

			<div
				class="w-10 h-10 text-xs flex items-center justify-center rounded-full bg-bronze-500 text-bronze-800"
			>
				{bronze}
			</div>

			<!-- <div
				class="w-10 h-10 text-xs flex items-center justify-center rounded-full bg-gray-700 text-gray-400"
			>
			 0
			</div> -->
		</div>
	</div>

	{#if didFail === true}
		<div
			class="mt-6 border border-red-700  flex flex-col space-y-4 sm:flex-row  sm:space-y-0 items-center justify-between rounded-tl-3xl rounded-br-3xl text-white bg-red-500 p-4"
		>
			<div class="flex items-center justify-start space-x-3">
				<div class="rounded-full bg-red-700 text-white p-1">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
				<p>We don't have this profile yet. Profile gets created with first reload of medals.</p>
			</div>
		</div>
	{/if}

	<div class="mt-6">
		<div class="flex flex-wrap gap-2 items-center justify-start">
			{#each categories as category}
				<a rel="external" href={'/user/' + profileId + category.url}>
					<button
						class="flex items-center justify-center space-x-3 rounded-tl-3xl rounded-br-3xl text-slate-600 bg-slate-200 py-2 px-6 font-bold hover:bg-slate-300"
						class:yearselected={category.current}
					>
						<p class="m-0 p-0">{category.name}</p>
					</button></a
				>
			{/each}
		</div>
	</div>

	<Instructions />
</div>
