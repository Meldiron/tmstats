<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { AppwriteService, toastConfig } from '$lib/appwrite';
	import Toastify from 'toastify-js';
	import type { PageProps } from './$types';
	import Header from '$lib/header.svelte';

	let { data }: PageProps = $props();

	let isLoading = $state(false);
	let userName = $state('');
	async function lookupProfile(event: Event) {
		event.preventDefault();

		try {
			isLoading = true;

			const id = await AppwriteService.getId(userName);
			if (id) {
				goto('/user/' + id + '/cotd');
			}
		} finally {
			isLoading = false;
		}
	}

	let isSigningOut = $state(false);
	async function signOut(event: Event) {
		event.preventDefault();

		try {
			isSigningOut = true;

			await AppwriteService.signOut();
			await invalidateAll();
		} finally {
			isSigningOut = false;
		}
	}

	let userId = $state('');
	function onVisitProfile(event: Event) {
		event.preventDefault();

		if (!isAccountId(userId)) {
			Toastify({
				...toastConfig,
				text: 'This is not a valid ID.',
				style: {
					background: '#f97316'
				}
			}).showToast();
			return;
		}
		goto('/user/' + userId + '/cotd');
	}
	function isAccountId(id: string): boolean {
		const regexp = new RegExp(
			'^[A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{12}$'
		);
		return regexp.test(id);
	}

	let hasNextPage = $state(data.leaderboard.length === 25);
	let isLeaderboardLoading = $state(false);
	async function loadNextLeaderboardPage() {
		if (isLeaderboardLoading) {
			return;
		}

		try {
			isLeaderboardLoading = true;

			const newPage = await AppwriteService.listProfiles(
				25,
				data.leaderboard[data.leaderboard.length - 1].$id
			);
			if (newPage) {
				data.leaderboard = [...data.leaderboard, ...newPage];

				if (newPage.length < 25) {
					hasNextPage = false;
				}
			}
		} finally {
			isLeaderboardLoading = false;
		}
	}
</script>

<div class="mx-auto mt-6 w-full max-w-5xl">
	<Header />

	{#if data.user}
		<div class="mt-6 rounded-tl-3xl rounded-br-3xl border border-gray-200 bg-white p-4">
			<h1 class="mb-3 text-2xl font-bold text-black">Welcome back, user!</h1>

			<p class="mb-3">
				If you wish to sign out, mostly useful to synchronize different account, you can do so
				below.
			</p>
			<form
				onsubmit={signOut}
				class="flex max-w-sm flex-col space-y-3 sm:max-w-none sm:flex-row sm:space-y-0 sm:space-x-4"
			>
				<button
					disabled={isSigningOut}
					type="submit"
					class="rounded-tl-3xl rounded-br-3xl bg-slate-500 px-6 py-2 font-bold text-white enabled:hover:bg-slate-600 disabled:opacity-50"
				>
					<p class="m-0 p-0">Sign out of account</p>
				</button>
			</form>
		</div>
	{/if}

	<div class="mt-6 rounded-tl-3xl rounded-br-3xl border border-gray-200 bg-white p-4">
		<h1 class="mb-3 text-2xl font-bold text-black">Profile Lookup by Nickname</h1>

		<p class="mb-3">
			Are you not sure what user ID is? Enter nickname here, and we will take care of finding ID.
		</p>
		<form
			onsubmit={lookupProfile}
			class="flex max-w-sm flex-col space-y-3 sm:max-w-none sm:flex-row sm:space-y-0 sm:space-x-4"
		>
			<input
				bind:value={userName}
				class="w-full rounded-md border border-slate-300 bg-slate-200 p-2 ring-slate-300 focus:ring focus:outline-none sm:max-w-sm"
				type="text"
				placeholder="MeldironSK"
			/>

			<button
				disabled={isLoading}
				type="submit"
				class="bg-author-500 enabled:hover:bg-author-600 rounded-tl-3xl rounded-br-3xl px-6 py-2 font-bold text-white disabled:opacity-50"
			>
				<p class="m-0 p-0">Visit Profile</p>
			</button>
		</form>
		<small class="mb-3 text-xs text-gray-400"
			>This action uses <a class="text-gray-600" target="_blank" href="https://trackmania.io/"
				>trackmania.io</a
			> services.</small
		>
	</div>

	<div class="mt-6 rounded-tl-3xl rounded-br-3xl border border-gray-200 bg-white p-4">
		<h1 class="mb-3 text-2xl font-bold text-black">Profile Lookup by ID</h1>

		<p class="mb-3">Do you know what your ID is? Here, find a profile by Trackmania ID.</p>
		<form
			onsubmit={onVisitProfile}
			class="flex max-w-sm flex-col space-y-3 sm:max-w-none sm:flex-row sm:space-y-0 sm:space-x-4"
		>
			<input
				bind:value={userId}
				class="w-full rounded-md border border-slate-300 bg-slate-200 p-2 ring-slate-300 focus:ring focus:outline-none sm:max-w-sm"
				type="text"
				placeholder="06e99ad3-cded-4440-a19c-b3df4fda8004"
			/>

			<button
				type="submit"
				class="bg-author-500 hover:bg-author-600 rounded-tl-3xl rounded-br-3xl px-6 py-2 font-bold text-white"
			>
				<p class="m-0 p-0">Visit Profile</p>
			</button>
		</form>
	</div>

	<div class="mt-6 rounded-tl-3xl rounded-br-3xl border border-gray-200 bg-white p-4">
		<h1 class="text-2xl font-bold text-black">Leaderboard</h1>

		<p class="mt-2 mb-2">
			<span class="text-red-500">This is not a global leaderboard!</span><br /> This only shows players
			in our database, not everyone.
		</p>

		<div class="mb-4 grid grid-cols-12 gap-3">
			<div class="col-span-8 hidden md:flex">
				<p class="hidden">Name</p>
			</div>
			<div class="col-span-1 hidden items-center justify-center md:flex">
				<img class="max-w-[30px]" src="/author.png" alt="Medal" />
			</div>
			<div class="col-span-1 hidden items-center justify-center md:flex">
				<img class="max-w-[30px]" src="/gold.png" alt="Medal" />
			</div>
			<div class="col-span-1 hidden items-center justify-center md:flex">
				<img class="max-w-[30px]" src="/silver.png" alt="Medal" />
			</div>
			<div class="col-span-1 hidden items-center justify-center md:flex">
				<img class="max-w-[30px]" src="/bronze.png" alt="Medal" />
			</div>

			{#if data.leaderboard === null}
				<svg
					class="h-5 w-5 animate-spin"
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

			{#each data.leaderboard as record, index (record['$id'])}
				<div class="col-span-12 md:col-span-8">
					<div class="flex items-baseline justify-start space-x-3">
						<div class="flex items-end justify-start">
							<h3 class="text-author-500 text-2xl leading-6 font-bold">{index + 1}.</h3>
							<p class="ml-2 text-lg leading-5 font-bold">{record.nickname}</p>
							<button class="ml-2 text-sm leading-4 text-gray-500">{record.score} points</button>
						</div>

						<a aria-label="Visit profile" href={'/user/' + record.$id + '/cotd'}>
							<button
								aria-label="Visit profile"
								class="bg-author-500 hover:bg-author-600 translate-y-[2px] transform rounded-tl-lg rounded-br-lg p-[2px] font-bold text-white"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
								</svg>
							</button>
						</a>
					</div>
				</div>
				<div class="col-span-1 hidden items-center justify-center md:flex">
					<p class="text-sm font-bold text-gray-600">{record.author}</p>
				</div>
				<div class="col-span-1 hidden items-center justify-center md:flex">
					<p class="text-sm font-bold text-gray-600">{record.gold}</p>
				</div>
				<div class="col-span-1 hidden items-center justify-center md:flex">
					<p class="text-sm font-bold text-gray-600">{record.silver}</p>
				</div>
				<div class="col-span-1 hidden items-center justify-center md:flex">
					<p class="text-sm font-bold text-gray-600">{record.bronze}</p>
				</div>
			{/each}
		</div>

		{#if hasNextPage}
			<button
				onclick={loadNextLeaderboardPage}
				disabled={isLeaderboardLoading}
				type="button"
				class="text-author-600 bg-author-100 enabled:hover:bg-author-200 rounded-tl-3xl rounded-br-3xl px-6 py-2 font-bold disabled:opacity-50"
			>
				<p class="m-0 p-0">Load More</p>
			</button>
		{/if}
	</div>
</div>
