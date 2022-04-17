<script>
	import { onMount } from 'svelte';

	import { Appwrite, Query } from 'appwrite';
	import { Utils } from '../utils';

	const appwrite = new Appwrite();

	appwrite.setEndpoint('https://appwrite.matejbaco.eu/v1').setProject('trackmaniaDailyStats');

	let userId = '';

	let leaderboard = [];

	onMount(async () => {
		const docs = await appwrite.database.listDocuments(
			'profiles',
			[],
			100,
			undefined,
			undefined,
			undefined,
			['score'],
			['DESC']
		);

		leaderboard = docs.documents;
	});
</script>

<div class="max-w-5xl w-full mx-auto mt-6 mb-6">
	<div class="mt-6 rounded-tl-3xl rounded-br-3xl bg-white border border-gray-200 p-4">
		<h1 class="font-bold text-black text-2xl mb-3">Trackmania Daily Stats</h1>

		<div class="prose">
			<p>Yearly view of your medals in daily maps. Current year: {new Date().getFullYear()}</p>
		</div>
	</div>

	<div class="mt-6 rounded-tl-3xl rounded-br-3xl bg-white border border-gray-200 p-4">
		<h1 class="font-bold text-black text-2xl mb-3">Leaderboard</h1>

		<div class="flex flex-col space-y-3 mb-4">
			{#each leaderboard as record, index}
				<div class="flex items-baseline justify-start space-x-3">
					<div class="flex items-end justify-start">
						<h3 class="leading-6 font-bold text-black text-author-500 text-2xl">{index + 1}.</h3>
						<p class="leading-5 ml-2 font-bold text-lg">{Utils.getName(record.$id)}</p>
						<p class="leading-4 ml-2 text-sm text-gray-500">{record.score} points</p>
					</div>

					<a href={'/user/' + record.$id}>
						<button
							class="transform translate-y-[2px] rounded-tl-lg rounded-br-lg text-white bg-author-600 p-[2px] font-bold"
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
			{/each}
		</div>

		<p class="text-xs text-gray-400">List is limited to maximum of 100 players.</p>
	</div>

	<div class="mt-6 rounded-tl-3xl rounded-br-3xl bg-white border border-gray-200 p-4">
		<h1 class="font-bold text-black text-2xl mb-3">Profile Lookup</h1>

		<p class="mb-3">
			Couldn't find player you are looking for? Here, look for his profile by his ID.
		</p>
		<div class="flex space-x-4">
			<input
				bind:value={userId}
				class="focus:outline-none focus:ring ring-slate-300 border border-slate-300 w-full max-w-sm bg-slate-200 p-2 rounded-md"
				type="text"
				placeholder="06e99ad3-cded-4440-a19c-b3df4fda8004"
			/>

			<a href={'/user/' + userId}>
				<button class="rounded-tl-3xl rounded-br-3xl text-white bg-author-600 py-2 px-6 font-bold"
					>Visit Profile</button
				>
			</a>
		</div>
	</div>
</div>
