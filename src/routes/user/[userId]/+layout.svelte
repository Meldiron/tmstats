<script>
	import { invalidateAll } from '$app/navigation';
	import { AppwriteService, toastConfig } from '$lib/appwrite.js';
	import Instructions from '$lib/instructions.svelte';
	import Toastify from 'toastify-js';

	let { children, data } = $props();

	const categories = [
		{
			id: 'cotd',
			name: 'Track of the day',
			url: '/cotd',
			current: false
		},
		{ id: 'shorts', name: 'Weekly shorts', url: '/shorts', current: true },
		{ id: 'campaign', name: 'Campaign', url: '/campaign', current: false }
	];

	let activeCategory = $state('');
	$effect(() => {
		if (data.path.includes('cotd')) {
			activeCategory = 'cotd';
		} else if (data.path.includes('shorts')) {
			activeCategory = 'shorts';
		} else if (data.path.includes('campaign')) {
			activeCategory = 'campaign';
		} else {
			activeCategory = '';
		}
	});

	let isSynchronizing = $state(false);
	async function onSynchronize() {
		if (isSynchronizing) {
			return;
		}

		isSynchronizing = true;

		try {
			Toastify({
				...toastConfig,
				style: {
					background: '#3b82f6'
				},
				duration: 2800,
				stopOnFocus: false,
				text: 'Sync of entire profile takes few minutes.'
			}).showToast();

			await AppwriteService.nadeoActionAll();
			await invalidateAll();
		} finally {
			isSynchronizing = false;
		}
	}
</script>

<div class="mx-auto mt-6 w-full max-w-5xl">
	<div
		class="flex flex-col items-center justify-between space-y-4 rounded-tl-3xl rounded-br-3xl border border-gray-900 bg-gray-800 p-4 text-2xl font-bold text-white sm:flex-row sm:space-y-0"
	>
		<div class="flex items-center justify-start space-x-3">
			<a aria-label="Go to homepage" href="/" class="rounded-full bg-gray-900 p-2">
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

			<h1>
				{data.profile.nickname}
				<span class="text-sm font-normal text-gray-400 uppercase">{data.profile.score} points</span>
			</h1>
		</div>
		<div class="flex items-center justify-center space-x-3">
			{#if data.user && data.user.$id === data.profile.$id}
				<div>
					<button
						aria-label="Synchronize data"
						disabled={isSynchronizing}
						onclick={onSynchronize}
						class="rounded-tl-2xl rounded-br-2xl bg-gray-700 px-4 py-3 text-sm font-semibold text-white enabled:hover:bg-gray-600 disabled:opacity-50"
					>
						Sync
					</button>
				</div>
			{/if}

			<div
				class="bg-author-500 text-author-800 flex h-10 w-10 items-center justify-center rounded-full text-xs"
			>
				{data.profile.author}
			</div>

			<div
				class="bg-gold-500 text-gold-800 flex h-10 w-10 items-center justify-center rounded-full text-xs"
			>
				{data.profile.gold}
			</div>

			<div
				class="text-silver-600 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xs"
			>
				{data.profile.silver}
			</div>

			<div
				class="bg-bronze-500 text-bronze-800 flex h-10 w-10 items-center justify-center rounded-full text-xs"
			>
				{data.profile.bronze}
			</div>
		</div>
	</div>

	<div class="mt-3 mb-6">
		<div class="flex flex-col items-center justify-between gap-3 md:flex-row">
			<div class="flex flex-wrap items-center justify-start gap-2">
				{#each categories as category (category.id)}
					<a href={'/user/' + data.profile.$id + category.url}>
						<button
							class="flex items-center justify-center space-x-3 rounded-tl-3xl rounded-br-3xl bg-slate-200 px-6 py-2 font-bold text-slate-600 hover:bg-slate-300"
							class:yearselected={category.id === activeCategory}
						>
							<p class="m-0 p-0">{category.name}</p>
						</button></a
					>
				{/each}
			</div>
		</div>
	</div>

	{#if new Date(data.profile.$updatedAt).getTime() < Date.now() - 1000 * 60 * 60 * 24}
		<div
			class="mx-auto mt-6 flex flex-col items-center justify-between space-y-4 rounded-tl-3xl rounded-br-3xl border border-blue-700 bg-blue-500 p-4 text-white sm:flex-row sm:space-y-0"
		>
			<p class="max-w-lg">
				This profile has not been updated in last 24 hours. It might be missing medals, or have them
				out of date.
			</p>

			{#if data.user && data.user.$id === data.profile.$id}
				<div>
					<button
						disabled={isSynchronizing}
						onclick={onSynchronize}
						class="flex items-center justify-center space-x-3 rounded-tl-3xl rounded-br-3xl bg-white px-6 py-2 font-bold text-nowrap text-slate-600 hover:bg-slate-100"
					>
						<p class="m-0 p-0">Synchronize medals</p>
					</button>
				</div>
			{/if}
		</div>
	{/if}

	{@render children()}

	<Instructions />
</div>
