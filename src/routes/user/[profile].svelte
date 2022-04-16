<script lang="ts">
	import { onMount } from 'svelte';
	import { Appwrite } from 'appwrite';

	const appwrite = new Appwrite();

	appwrite.setEndpoint('https://appwrite.matejbaco.eu/v1').setProject('trackmaniaDailyStats');

	import { page } from '$app/stores';

	const profiles = {
		'06e99ad3-cded-4440-a19c-b3df4fda8004': 'Meldiron',
		'5ca1fa3a-3413-4863-86d7-7a47982abc1b': 'Dejwfík',
		'f6fe29aa-45dc-4fe9-9a95-d5e2c39f6b5f': 'Benko'
	};

	const profileId = $page.params.profile;
	const profileName = profiles[profileId] ?? 'Unknown Name';
	let lastUpdate = '...';

	const monthNames = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'Jule',
		'August',
		'September',
		'October',
		'November',
		'December'
	];
	const months = [];

	let finish = 0;
	let silver = 0;
	let bronze = 0;
	let gold = 0;
	let author = 0;

	let totalPoints = 0;

	for (let month = 0; month < 12; month++) {
		months.push({
			month: month + 1,
			name: monthNames[month]
		});
	}

	onMount(async () => {
		const dbRes = await appwrite.database.getDocument<any>('profiles', profileId);
		const dataSet = JSON.parse(dbRes.medals);

		lastUpdate = moment(dbRes.lastUpdate).format('DD.MM.YYYY HH:mm');

		Object.keys(dataSet).forEach((k) => {
			const medal = dataSet[k];

			if (medal === 0) {
				finish++;
			} else if (medal === 1) {
				bronze++;

				totalPoints += 1;
			} else if (medal === 2) {
				silver++;

				totalPoints += 2;
			} else if (medal === 3) {
				gold++;

				totalPoints += 4;
			} else if (medal === 4) {
				author++;

				totalPoints += 8;
			}
		});

		const year = new Date().getFullYear();

		for (const month of months) {
			const number = month.month;

			let data = Object.keys(dataSet)
				.filter((d) => {
					const m = d.split('-')[1];
					return +m === number;
				})
				.map((key) => {
					return {
						date: moment(key, 'D-M-YYYY').toDate(),
						value: dataSet[key]
					};
				});

			const colors = [
				'#374151', // Finish Only, same as empty
				'#cd7f32', // Bronze
				'#ffffff', // Silver
				'#ffd700', // Gold
				'#14b583' // Author
			];

			const isAuthorMissing = data.find((d) => d.value === 4) === undefined;
			const isGoldMissing = data.find((d) => d.value === 3) === undefined;
			const isSilverMissing = data.find((d) => d.value === 2) === undefined;
			const isBronzeMissing = data.find((d) => d.value === 1) === undefined;

			if (isAuthorMissing) {
				colors.splice(4, 1);
			}

			if (isGoldMissing) {
				colors.splice(3, 1);

				data = data.map((d) => {
					if (d.value > 3) {
						d.value--;
					}
					return d;
				});
			}

			if (isSilverMissing) {
				colors.splice(2, 1);

				data = data.map((d) => {
					if (d.value > 2) {
						d.value--;
					}
					return d;
				});
			}

			if (isBronzeMissing) {
				colors.splice(1, 1);

				data = data.map((d) => {
					if (d.value > 1) {
						d.value--;
					}
					return d;
				});
			}

			const map = new SvelteHeatmap({
				props: {
					allowOverflow: true,
					cellGap: 4,
					cellRadius: 2,
					monthLabelHeight: 0,
					dayLabelWidth: 0,
					colors,
					data,
					emptyColor: '#374151',
					fontColor: '#ffffff',
					monthGap: 0,
					startDate: moment('1-' + number + '-' + year, 'D-M-YYYY')
						.startOf('month')
						.toDate(),
					endDate: moment('1-' + number + '-' + year, 'D-M-YYYY')
						.endOf('month')
						.toDate(),
					view: 'monthly'
				},
				target: document.querySelector('#heatmap-' + number)
			});
		}
	});

	async function updateData() {
		try {
			await appwrite.account.get();
		} catch (err) {
			await appwrite.account.createAnonymousSession();
		}

		try {
			const res = await appwrite.functions.createExecution(
				'nadeoAction',
				JSON.stringify({
					type: 'updateProfile',
					userId: profileId
				}),
				false
			);

			throw new Error(res.stdout + ',' + res.stderr);
		} catch (err) {
			alert(err.message);
		}
	}
</script>

<div class="max-w-5xl w-full mx-auto mt-6 mb-6">
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

			<div
				class="w-10 h-10 text-xs flex items-center justify-center rounded-full bg-gray-700 text-gray-400"
			>
				{finish}
			</div>
		</div>
	</div>

	<div class="grid grid-cols-12 gap-6 mt-6">
		{#each months as month}
			<div
				class="border border-gray-900 p-4 bg-gray-800 rounded-tl-3xl rounded-br-xl col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-3"
			>
				<h3 class="mb-3 font-semibold text-lg text-gray-200">{month.name}</h3>

				<div id={'heatmap-' + month.month} />
			</div>
		{/each}
	</div>

	<div class="mt-6 rounded-tl-3xl rounded-br-3xl bg-white border border-gray-200 p-4">
		<h1 class="font-bold text-black text-2xl mb-3">How to Read Data?</h1>

		<div class="prose">
			<p>Cells on website follow same color pallete as medals in TrackMania game.</p>
			<ul>
				<li class="text-author-500">Green is <b class="font-bold">Author Medal</b></li>
				<li class="text-gold-500">Yellow is <b class="font-bold">Gold Medal</b></li>
				<li class="text-silver-500">Dark Gray is <b class="font-bold">Silver Medal</b></li>
				<li class="text-bronze-500">Orange is <b class="font-bold">Bronze Medal</b></li>
				<li class="text-gray-200">Light Gray is <b class="font-bold">No Medal</b></li>
			</ul>
			<p>
				If you have finished a map but didn't get any medal, the cell has the same color as if you
				would never play the map. Try harder, you can do this!
			</p>
			<p>
				New data is not fetched automatically. To request a data update, click button below. Keep in
				mind this only schedules request into a queue. If there is a long queue, you might need to
				wait minutes, or even hours for your profile update.
			</p>

			<div
				class="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 items-center justify-start"
			>
				<button
					on:click={updateData}
					class="rounded-tl-3xl rounded-br-xl text-white bg-author-600 py-2 px-6 font-bold"
					>Update Data</button
				>

				<p class="text-gray-400">Last update <b class="font-bold">{lastUpdate}</b></p>
			</div>
		</div>
	</div>
</div>
