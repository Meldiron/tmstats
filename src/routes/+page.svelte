<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { AppwriteService, toastConfig } from '$lib/appwrite';
	import Toastify from 'toastify-js';
	import type { PageProps } from './$types';
	import Header from '$lib/header.svelte';
	import LeaderboardRow from '$lib/leaderboard/LeaderboardRow.svelte';
	import LeaderboardSkeleton from '$lib/leaderboard/LeaderboardSkeleton.svelte';
	import WelcomeSkeleton from '$lib/leaderboard/WelcomeSkeleton.svelte';

	let { data }: PageProps = $props();

	let isLoading = $state(false);
	let userName = $state('');
	async function lookupProfile(event: Event) {
		event.preventDefault();

		try {
			isLoading = true;

			const id = await AppwriteService.getId(userName);
			if (id) {
				goto('/user/' + id + '/');
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
		goto('/user/' + userId + '/');
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

	let isOauthStarted = $state(false);
</script>

<div class="mx-auto mt-6 w-full max-w-5xl">
	<Header />

	{#if data.user === undefined}
		<WelcomeSkeleton />
	{:else if data.user}
		<div class="mt-6 rounded-tl-3xl rounded-br-3xl border border-gray-200 bg-white p-4">
			<h1 class="mb-3 text-2xl font-bold text-black">Welcome back, {data.user.name}!</h1>

			<p class="mb-3">Ready to check your latest medals and ranking progress?</p>

			<div class="flex flex-col gap-3 sm:flex-row">
				<a
					class="bg-author-500 hover:bg-author-600 rounded-tl-3xl rounded-br-3xl px-6 py-2 text-center font-bold text-white"
					href={`/user/${data.user.$id}/`}
				>
					View My Profile</a
				>
				<form
					class="flex max-w-sm flex-col space-y-3 sm:max-w-none sm:flex-row sm:space-y-0 sm:space-x-4"
				>
					<button
						disabled={isSigningOut}
						type="submit"
						class="rounded-tl-3xl rounded-br-3xl bg-slate-500 px-6 py-2 font-bold text-white enabled:hover:bg-slate-600 disabled:opacity-50"
					>
						<p class="m-0 p-0">Sign Out</p>
					</button>
				</form>
			</div>
		</div>
	{:else}
		<div class="mt-6 rounded-tl-3xl rounded-br-3xl border border-gray-200 bg-white p-4">
			<h1 class="mb-3 text-2xl font-bold text-black">Join the Leaderboard</h1>

			<p class="mb-3">Sign in to sync your medals, track your progress, and compete with the community.</p>

			<div class="flex flex-col gap-3 sm:flex-row">
				<a href="/oauth/redirect?path=PLACEHOLDER_USER_PROFILE">
					<button
						class=" bg-author-500 active:hover:bg-author-600 rounded-tl-3xl rounded-br-3xl px-6 py-2 text-center font-bold text-white disabled:opacity-50"
						onclick={() => (isOauthStarted = true)}
						disabled={isOauthStarted}
					>
						Sign In with Trackmania
					</button>
				</a>
			</div>
		</div>
	{/if}

	<div class="mt-6 rounded-tl-3xl rounded-br-3xl border border-gray-200 bg-white p-4 md:p-6">
		<div class="mb-4 flex flex-col gap-1">
			<div class="flex items-center gap-3">
				<h1 class="text-2xl font-bold text-black">Top Racers</h1>
				<span class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-600">
					{data.leaderboard.length}{#if hasNextPage}+{/if} Players
				</span>
			</div>
			<p class="text-sm text-gray-500">
				Leaderboard includes players who have synced their profiles. <span class="font-medium text-gray-700">Sign in to appear here.</span>
			</p>
		</div>

		{#if data.leaderboard === null}
			<LeaderboardSkeleton />
		{:else}
			<div class="divide-y divide-gray-50">
				{#each data.leaderboard as record, index (record['$id'])}
					<LeaderboardRow {record} {index} />
				{/each}
			</div>
		{/if}

		{#if hasNextPage}
			<div class="mt-4 flex justify-center">
				<button
					onclick={loadNextLeaderboardPage}
					disabled={isLeaderboardLoading}
					type="button"
					class="flex items-center gap-2 rounded-tl-3xl rounded-br-3xl bg-author-500 px-8 py-2.5 font-bold text-white shadow-sm transition-colors enabled:hover:bg-author-600 disabled:opacity-50"
				>
					{#if isLeaderboardLoading}
						<svg
							class="h-4 w-4 animate-spin"
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
						<span>Loading...</span>
					{:else}
						<span>Show More Racers</span>
					{/if}
				</button>
			</div>
		{/if}
	</div>

	<div class="mt-6 rounded-tl-3xl rounded-br-3xl border border-gray-200 bg-white p-4">
		<h1 class="mb-3 text-2xl font-bold text-black">Find a Racer</h1>

		<p class="mb-3">
			Search by nickname to discover any player's medal stats and ranking.
		</p>
		<form
			onsubmit={lookupProfile}
			class="flex max-w-sm flex-col space-y-3 sm:max-w-none sm:flex-row sm:space-y-0 sm:space-x-4"
		>
			<input
				bind:value={userName}
				class="w-full rounded-md border border-slate-300 bg-slate-200 p-2 ring-slate-300 focus:ring focus:outline-none sm:max-w-sm"
				type="text"
				placeholder="Enter nickname..."
			/>

			<button
				disabled={isLoading}
				type="submit"
				class="bg-author-500 enabled:hover:bg-author-600 rounded-tl-3xl rounded-br-3xl px-6 py-2 font-bold text-white disabled:opacity-50"
			>
				<p class="m-0 p-0">Search</p>
			</button>
		</form>
		<small class="mb-3 text-xs text-gray-400"
			>Powered by <a class="text-gray-600 hover:text-author-600 transition-colors" target="_blank" href="https://trackmania.io/"
				>trackmania.io</a
			></small
		>
	</div>

	<div class="mt-6 rounded-tl-3xl rounded-br-3xl border border-gray-200 bg-white p-4">
		<h1 class="mb-3 text-2xl font-bold text-black">Search by Trackmania ID</h1>

		<p class="mb-3">Already know the ID? Look up any profile instantly.</p>
		<form
			onsubmit={onVisitProfile}
			class="flex max-w-sm flex-col space-y-3 sm:max-w-none sm:flex-row sm:space-y-0 sm:space-x-4"
		>
			<input
				bind:value={userId}
				class="w-full rounded-md border border-slate-300 bg-slate-200 p-2 ring-slate-300 focus:ring focus:outline-none sm:max-w-sm"
				type="text"
				placeholder="Paste Trackmania ID..."
			/>

			<button
				type="submit"
				class="bg-author-500 hover:bg-author-600 rounded-tl-3xl rounded-br-3xl px-6 py-2 text-center font-bold text-white"
			>
				<p class="m-0 p-0">Search</p>
			</button>
		</form>
	</div>
</div>
