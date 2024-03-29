<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { AppwriteService, toastConfig } from '../appwrite';
	import Toastify from 'toastify-js';

	let userId = '';
	let userName = '';

	let limit = 100;

	let isLoading = false;

	let isLeaderboardLoading = false;
	let hasNextPage = true;
	let leaderboard = null;
	let offset = 0 + limit;

	let orerByAttr = 'points';

	async function loadNextLeaderboardPage() {
		if (isLeaderboardLoading) {
			return;
		}

		try {
			isLeaderboardLoading = true;

			const newPage = await AppwriteService.listProfiles(orerByAttr, limit, offset);
			if (newPage) {
				leaderboard = [...leaderboard, ...newPage];

				if (newPage.length < limit) {
					hasNextPage = false;
				}

				offset += limit;
			}
		} catch (err) {
		} finally {
			isLeaderboardLoading = false;
		}
	}

	function orderBy(sort: string) {
		return () => {
			orerByAttr = sort;
			onMountFunction();
		};
	}

	function isAccountId(id: string): boolean {
		const regexp = new RegExp(
			'^[A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{12}$'
		);
		return regexp.test(id);
	}

	function onVisitProfile() {
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
		goto('/user/' + userId + '/' + new Date().getFullYear());
	}

	async function lookupProfile() {
		try {
			isLoading = true;

			const id = await AppwriteService.getId(userName);
			if (id) {
				goto('/user/' + id + '/' + new Date().getFullYear());
			}
		} finally {
			isLoading = false;
		}
	}

	const onMountFunction = async () => {
		leaderboard = await AppwriteService.listProfiles(orerByAttr, limit, 0);
		if (!leaderboard) {
			leaderboard = [];
		}

		if (leaderboard.length < limit) {
			hasNextPage = false;
		}
	};

	onMount(onMountFunction);
</script>

<div class="max-w-5xl w-full mx-auto mt-6">
	<div class="mt-6 rounded-tl-3xl rounded-br-3xl bg-white border border-gray-200 p-4">
		<div
			class="flex flex-col md:flex-row md:space-x-4 flex space-x-0 space-y-4 md:space-y-4 md:items-center"
		>
			<img class="w-24" src="/logo.svg" alt="" />

			<div>
				<h1 class="font-bold text-black text-2xl mb-3">TMStats | Medal Tracker</h1>

				<div class="prose">
					<p>
						Overview of all Trackmania medals you achieved. Share your campaign or daily maps medals
						with anyone!
					</p>
				</div>
			</div>
		</div>

		<div class="prose mt-4">
			<p class="text-sm text-gray-400">
				This website introduces private leaderboard that only consists of players whose profile has
				been loaded before. If you are looking for worldwide stats, you can visit <a
					href="https://www.author-tracker.com/"
					target="_blank">TM Author Tracker</a
				>.
			</p>
		</div>
	</div>

	<div class="mt-6 rounded-tl-3xl rounded-br-3xl bg-white border border-gray-200 p-4">
		<h1 class="font-bold text-black text-2xl mb-3">Profile Lookup by Nickname</h1>

		<p class="mb-3">
			Are you not sure what user ID is? Enter nickname here, and we will take care of finding ID.
		</p>
		<form
			on:submit|preventDefault={lookupProfile}
			class="max-w-sm sm:max-w-none flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4"
		>
			<input
				bind:value={userName}
				class="focus:outline-none sm:max-w-sm focus:ring ring-slate-300 border border-slate-300 w-full bg-slate-200 p-2 rounded-md"
				type="text"
				placeholder="MeldironSK"
			/>

			<button
				type="submit"
				class="rounded-tl-3xl rounded-br-3xl text-white bg-author-500 hover:bg-author-600 py-2 px-6 font-bold"
			>
				{#if isLoading}
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
				{:else}
					<p class="m-0 p-0">Visit Profile</p>
				{/if}
			</button>
		</form>
		<small class="text-xs mb-3 text-gray-400"
			>This action uses <a class="text-gray-600" target="_blank" href="https://trackmania.io/"
				>trackmania.io</a
			> services.</small
		>
	</div>

	<div class="mt-6 rounded-tl-3xl rounded-br-3xl bg-white border border-gray-200 p-4">
		<h1 class="font-bold text-black text-2xl mb-3">Profile Lookup by ID</h1>

		<p class="mb-3">Do you know what your ID is? Here, find a profile by Trackmania ID.</p>
		<form
			on:submit|preventDefault={onVisitProfile}
			class="max-w-sm sm:max-w-none flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4"
		>
			<input
				bind:value={userId}
				class="focus:outline-none focus:ring ring-slate-300 border border-slate-300 w-full sm:max-w-sm bg-slate-200 p-2 rounded-md"
				type="text"
				placeholder="06e99ad3-cded-4440-a19c-b3df4fda8004"
			/>

			<button
				type="submit"
				class="rounded-tl-3xl rounded-br-3xl text-white bg-author-500 hover:bg-author-600 py-2 px-6 font-bold"
			>
				<p class="m-0 p-0">Visit Profile</p>
			</button>
		</form>
	</div>

	<div class="mt-6 rounded-tl-3xl rounded-br-3xl bg-white border border-gray-200 p-4">
		<h1 class="font-bold text-black text-2xl">Leaderboard</h1>

		<p class="mb-2 mt-2">
			<span class="text-red-500">This is not a global leaderboard!</span> This only shows players in
			our database, not everyone.
		</p>

		<small class="text-xs mb-3 text-gray-400">Ordered by {orerByAttr}. </small>

		<div class="grid grid-cols-12 gap-3 mb-4">
			<div class="hidden md:flex col-span-8" />
			<button
				on:click={orderBy('author')}
				class="hidden md:flex col-span-1 items-center justify-center"
			>
				<img class="max-w-[30px]" src="/author.png" alt="Medal" />
			</button>
			<button
				on:click={orderBy('gold')}
				class="hidden md:flex col-span-1  items-center justify-center"
			>
				<img class="max-w-[30px]" src="/gold.png" alt="Medal" />
			</button>
			<button
				on:click={orderBy('silver')}
				class="hidden md:flex col-span-1  items-center justify-center"
			>
				<img class="max-w-[30px]" src="/silver.png" alt="Medal" />
			</button>
			<button
				on:click={orderBy('bronze')}
				class="hidden md:flex col-span-1  items-center justify-center"
			>
				<img class="max-w-[30px]" src="/bronze.png" alt="Medal" />
			</button>

			{#if leaderboard === null}
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

			{#each leaderboard ?? [] as record, index}
				<div class="col-span-12 md:col-span-8">
					<div class="flex items-baseline justify-start space-x-3">
						<div class="flex items-end justify-start">
							<h3 class="leading-6 font-bold text-black text-author-500 text-2xl">{index + 1}.</h3>
							<p class="leading-5 ml-2 font-bold text-lg">{record.nickname}</p>
							<button on:click={orderBy('points')} class="leading-4 ml-2 text-sm text-gray-500"
								>{record.score} points</button
							>
						</div>

						<a href={'/user/' + record.$id + '/' + new Date().getFullYear()}>
							<button
								class="transform translate-y-[2px] rounded-tl-lg rounded-br-lg text-white bg-author-500 hover:bg-author-600 p-[2px] font-bold"
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
				<div class="hidden md:flex col-span-1  items-center justify-center">
					<p class="font-bold text-sm text-gray-600">{record.author}</p>
				</div>
				<div class="hidden md:flex col-span-1  items-center justify-center">
					<p class="font-bold text-sm text-gray-600">{record.gold}</p>
				</div>
				<div class="hidden md:flex col-span-1  items-center justify-center">
					<p class="font-bold text-sm text-gray-600">{record.silver}</p>
				</div>
				<div class="hidden md:flex col-span-1  items-center justify-center">
					<p class="font-bold text-sm text-gray-600">{record.bronze}</p>
				</div>
			{/each}
		</div>

		{#if leaderboard !== null && hasNextPage}
			<button
				on:click={loadNextLeaderboardPage}
				type="button"
				class="rounded-tl-3xl rounded-br-3xl text-author-600 bg-author-100 hover:bg-author-200 py-2 px-6 font-bold"
			>
				{#if isLeaderboardLoading}
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
				{:else}
					<p class="m-0 p-0">Load More</p>
				{/if}
			</button>
		{/if}

		<p class="mt-4 text-xs text-gray-400">List is limited to maximum of 5000 players.</p>
	</div>
</div>
