<script lang="ts">
	import { onMount } from 'svelte';

	import { page } from '$app/stores';
	import { AppwriteService } from '../../../appwrite';

	let profileId;
	let currentYear;
	let profileName = '...';
	let currentYearScore = 0;
	let didFail = null;

	let isLoading = false;

	const years = [];
	for (let y = 2020; y <= new Date().getFullYear(); y++) {
		years.push(y);
	}

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
	let noMedalMaps = [];
	let lastUpdate = '...';

	let heatMaps = [];

	for (let month = 0; month < 12; month++) {
		months.push({
			month: month + 1,
			name: monthNames[month]
		});
	}

	const onMountFunction = async () => {
		console.log('INIT');

		for (const heatMap of heatMaps) {
			heatMap.$destroy();
		}

		finish = 0;
		silver = 0;
		bronze = 0;
		gold = 0;
		author = 0;
		totalPoints = 0;
		noMedalMaps = [];
		lastUpdate = '...';
		heatMaps = [];
		currentYearScore = 0;
		didFail = null;

		let dbRes;

		try {
			dbRes = await AppwriteService.getHeatmap(profileId);
			didFail = false;
		} catch (err) {
			didFail = true;
		}

		if (!dbRes) {
			return;
		}

		const dataSet = dbRes.medals;

		profileName = dbRes.nickname;

		lastUpdate = moment(dbRes.lastUpdate).format('DD.MM.YYYY HH:mm');

		for (const k in dataSet) {
			const medal = dataSet[k];

			if (medal === 0) {
				finish++;

				noMedalMaps = [...noMedalMaps, k];
			} else if (medal === 1) {
				bronze++;

				totalPoints += 1;
				console.log(+k.split('-')[2]);
				if (+k.split('-')[2] === +currentYear) {
					currentYearScore += 1;
				}
			} else if (medal === 2) {
				silver++;

				totalPoints += 2;
				if (+k.split('-')[2] === +currentYear) {
					currentYearScore += 2;
				}
			} else if (medal === 3) {
				gold++;

				totalPoints += 4;
				if (+k.split('-')[2] === +currentYear) {
					currentYearScore += 4;
				}
			} else if (medal === 4) {
				author++;

				totalPoints += 12;
				if (+k.split('-')[2] === +currentYear) {
					currentYearScore += 12;
				}
			}
		}

		const year = +currentYear;

		for (const month of months) {
			const number = month.month;

			let data = Object.keys(dataSet)
				.filter((d) => {
					const m = d.split('-')[1];
					const y = d.split('-')[2];
					return +m === number && +y === year;
				})
				.map((key) => {
					return {
						date: moment(key, 'D-M-YYYY').toDate(),
						value: dataSet[key]
					};
				});

			const colors = [
				'#ff1493', // Finish Only, same as empty
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

			document.querySelector('#heatmap-' + number).innerHTML = '';

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

			heatMaps = [...heatMaps, map];
		}
	};

	onMount(onMountFunction);

	let lastFootprint = null;
	page.subscribe(async () => {
		currentYear = $page.params.year;
		profileId = $page.params.profile;

		if (lastFootprint === null) {
			lastFootprint = '{}';
			return;
		}

		const footprint = JSON.stringify($page.params);
		if (lastFootprint !== footprint) {
			lastFootprint = footprint;
			onMountFunction();
		}
	});

	async function updateData() {
		if (isLoading) {
			return;
		}

		isLoading = true;

		try {
			const msg = await AppwriteService.nadeoAction(profileId);
			onMountFunction();
			throw new Error(msg);
		} catch (err) {
			alert(err.message);
		}

		isLoading = false;
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

	<div class="md:mt-0 mt-6 flex flex-col md:flex-row items-center justify-between space-x-3">
		<div class="flex items-center justify-start space-x-2">
			{#each years as year}
				<a href={'/user/' + profileId + '/' + year}>
					<button
						class="flex items-center justify-center space-x-3 rounded-tl-3xl rounded-br-3xl text-slate-600 bg-slate-200 py-2 px-6 font-bold hover:bg-slate-300"
						class:yearselected={year === +currentYear}
					>
						<p class="m-0 p-0">{year}</p>
					</button></a
				>
			{/each}
		</div>

		<div
			class=" my-4 flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 items-center justify-end"
		>
			<p class="text-gray-400">Last update <b class="font-bold">{lastUpdate}</b></p>

			<button
				on:click={updateData}
				class="flex items-center justify-center space-x-3 rounded-tl-3xl rounded-br-3xl text-white bg-author-500 hover:bg-author-600 py-2 px-6 font-bold"
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
					<p class="m-0 p-0">Update Profile</p>
				{/if}
			</button>
		</div>
	</div>

	<div class="grid grid-cols-12 gap-6 mt-6">
		{#each months as month}
			<div
				class="border border-gray-900 p-4 bg-gray-800 rounded-tl-3xl rounded-br-3xl col-span-6 sm:col-span-6 md:col-span-4 lg:col-span-3"
			>
				<h3 class="mb-3 font-semibold text-lg text-gray-200">{month.name}</h3>

				<div id={'heatmap-' + month.month} />
			</div>
		{/each}
	</div>

	{#if didFail === false}
		<div
			class="mt-6 border border-blue-700  flex flex-col space-y-4 sm:flex-row  sm:space-y-0 items-center justify-between rounded-tl-3xl rounded-br-3xl text-white bg-blue-500 p-4"
		>
			<div class="flex items-center justify-start space-x-3">
				<div class="rounded-full bg-blue-700 text-white p-1">
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
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
				<p>Profile update can take up to a few minutes.</p>
			</div>
		</div>
	{:else if didFail === true}
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
				<p>
					We don't have this profile yet. Click 'Update Profile' to start fetching data. Be aware,
					it can take a few minutes.
				</p>
			</div>
		</div>
	{/if}

	<div class="mt-6 rounded-tl-3xl rounded-br-3xl bg-white border border-gray-200 p-4">
		<h1 class="font-bold text-black text-2xl mb-3">How to Read Data?</h1>

		<div class="prose">
			<p>Cells on website follow same color pallete as medals in Trackmania game.</p>
			<ul>
				<li class="text-author-500">Green is <b class="font-bold">Author Medal</b></li>
				<li class="text-gold-500">Yellow is <b class="font-bold">Gold Medal</b></li>
				<li class="text-silver-500">White is <b class="font-bold">Silver Medal</b></li>
				<li class="text-bronze-500">Orange is <b class="font-bold">Bronze Medal</b></li>
				<li class="text-gray-200">Dark Gray is <b class="font-bold">No Medal</b></li>
			</ul>
			<p>
				If you have finished a map but didn't get any medal, the cell has the same color as if you
				would never play the map. Try harder, you can do this! Here is a list of maps you finished
				but didn't get medal on:
			</p>
			<ul>
				{#each noMedalMaps as map}
					<li>
						{map}
					</li>
				{/each}

				{#if noMedalMaps.length <= 0}
					<li class="text-author-500">All maps are fine!</li>
				{/if}
			</ul>
			<p>
				New data is not fetched automatically. To request a data update, use 'Update Profile' button
				at the top of the page. Keep in mind this only schedules request into a queue. If there is a
				long queue, you might need to wait minutes, or even hours for your profile update.
			</p>
			<p>
				Your score for year <strong>{currentYear}</strong> is
				<strong>{currentYearScore} points.</strong>
			</p>
		</div>
	</div>
</div>
