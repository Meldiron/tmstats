<script lang="ts">
	import { onMount } from 'svelte';

	import { page } from '$app/stores';
	import { AppwriteService } from '../../../appwrite';
	import Badge from '$lib/badge.svelte';

	let profileId;
	let currentYear;
	let profileName = '...';
	let currentYearScore = 0;
	let maxPoints = 0;
	let didFail = null;
	let dataSet = null;

	const cursor = {
		visible: false,
		left: 0,
		top: 0,
		data: {} as any
	};

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
		'July',
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
	let noMedalMaps = null;
	let lastUpdate = '...';

	let modalData = null;

	let heatMaps = [];

	for (let month = 0; month < 12; month++) {
		months.push({
			month: month + 1,
			name: monthNames[month]
		});
	}

	function formatTime(ms: number) {
		const mins = Math.floor(ms / 1000 / 60);
		ms -= mins * 1000 * 60;
		const secs = Math.floor(ms / 1000);
		ms -= secs * 1000;

		return `${mins < 10 ? '0' + mins : mins}:${secs < 10 ? '0' + secs : secs}.${
			ms > 99 ? ms : '0' + ms
		}`;
	}

	const onMountFunction = async () => {
		if (!$page.url.pathname.startsWith('/user/')) {
			return;
		}

		for (const heatMap of heatMaps) {
			heatMap.$destroy();
		}

		finish = 0;
		silver = 0;
		bronze = 0;
		gold = 0;
		author = 0;
		totalPoints = 0;
		noMedalMaps = null;
		lastUpdate = '...';
		heatMaps = [];
		currentYearScore = 0;
		maxPoints = 0;
		didFail = null;
		dataSet = null;

		let dbRes = await AppwriteService.getHeatmap(profileId);

		if (!dbRes) {
			didFail = true;
			return;
		} else {
			didFail = false;
		}

		dataSet = dbRes.medals;

		profileName = dbRes.nickname;

		lastUpdate = moment(dbRes.lastUpdate).format('DD.MM.YYYY HH:mm');

		let localNoMedals = [];

		for (const k in dataSet) {
			const medal = dataSet[k].medal;

			if (medal === 0) {
				finish++;

				localNoMedals = [...localNoMedals, k];
			} else if (medal === 1) {
				bronze++;

				totalPoints += 1;

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

		const medalMapDocuments = await AppwriteService.getMapsDetails(Object.keys(dataSet));

		if (medalMapDocuments) {
			noMedalMaps = medalMapDocuments.filter((d) => localNoMedals.includes(d.$id));
		}

		maxPoints = getMaxPoints(currentYear);

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
						value: dataSet[key].medal,
						data: {
							id: key,
							raw: dataSet[key],
							hover: true,
							mapData: medalMapDocuments.find((d) => d.$id === key)
						}
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

			data = data.map((d) => {
				return {
					...d,
					mouseEnter: (event) => {
						const idSplit = event.id.split('-');
						const date = new Date(idSplit[2], idSplit[1] - 1, idSplit[0]);
						const dayName = date.toLocaleDateString(undefined, { weekday: 'long' });

						cursor.visible = true;
						cursor.left = event.pos.x + event.pos.width / 2;
						cursor.top = event.pos.y;
						cursor.data = {
							id: event.id,
							medal: dataSet[event.id].medal,
							text: dayName + ' ' + event.id.split('-').join('.')
						};
					},
					mouseLeave: (event) => {
						cursor.visible = false;
					},
					mouseDown: (event) => {
						modalData = event.mapData;
					}
				};
			});

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
			const res = await AppwriteService.nadeoAction(profileId);

			if (res) {
				onMountFunction();
			}
		} finally {
			isLoading = false;
		}
	}

	function getMaxPoints(y) {
		y = +y;

		if (y === 2020) {
			return 184 * 12;
		} else if (y === new Date().getFullYear()) {
			let totalDays = 0;

			for (let m = 1; m <= new Date().getMonth(); m++) {
				const d = moment(m + '-' + y, 'MM-YYYY');
				totalDays += d.daysInMonth();
			}

			totalDays += new Date().getDate() - 1;

			return totalDays * 12;
		} else {
			let totalDays = 0;

			for (let m = 1; m <= 12; m++) {
				const d = moment(m + '-' + y, 'MM-YYYY');
				totalDays += d.daysInMonth();
			}

			return totalDays * 12;
		}
	}
</script>

{#if cursor.visible}
	<div
		style={'left: ' + cursor.left + 'px; top: ' + (cursor.top - 10) + 'px'}
		class="fixed text-center left-40 top-40 bg-slate-900  border border-slate-600 rounded-tl-xl rounded-br-xl px-3 py-1 text-white transform -translate-x-1/2 -translate-y-full pointer-events-none"
	>
		{cursor.data.text}
	</div>
{/if}

{#if modalData !== null}
	<div
		on:click={() => (modalData = null)}
		class="flex overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 w-full inset-0 md:h-full justify-center bg-slate-900 bg-opacity-75"
	>
		<div class="relative w-full max-w-2xl sm:pt-4">
			<div
				class="relative bg-white rounded-lg shadow"
				on:click={(event) => event.stopPropagation()}
			>
				<div class="flex justify-between items-start p-4 rounded-t">
					<h3 class="text-xl font-semibold text-gray-900">{modalData.name}</h3>
					<button
						on:click={() => (modalData = null)}
						type="button"
						class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
						data-modal-toggle="defaultModal"
					>
						<svg
							class="w-5 h-5"
							fill="currentColor"
							viewBox="0 0 20 20"
							xmlns="http://www.w3.org/2000/svg"
							><path
								fill-rule="evenodd"
								d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
								clip-rule="evenodd"
							/></svg
						>
					</button>
				</div>

				<div class="p-6 pt-0">
					<div class="bg-gray-200 shadow-inner aspect-video w-full overflow-hidden rounded-lg">
						<img
							src={AppwriteService.getImg(modalData.thumbnailFileId).toString()}
							class="w-full h-full object-cover object-center"
							alt=""
						/>
					</div>
				</div>

				<div class="pt-0 p-6 space-y-6">
					<div class="block">
						<Badge score={modalData.difficulty} long={true} />

						<span
							class="bg-blue-100 text-blue-800 space-x-2 text-xs font-medium inline-flex items-center px-3 py-1.5 rounded"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
								<path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
							</svg>
							<span>{modalData.totalScorePositions.toLocaleString()} finishes</span>
						</span>

						<span
							class="bg-gray-800 text-gray-200 space-x-2 text-xs font-medium inline-flex items-center px-3 py-1.5 rounded"
							><svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
									clip-rule="evenodd"
								/>
							</svg>
							<span>{modalData.$id.split('-').join('.')}</span>
						</span>
					</div>

					<div>
						<h1 class="font-bold text-xl mb-2">Medal Times</h1>

						<div class="flex flex-col space-y-4">
							<div class="flex items-center space-x-3">
								<img src="/author.png" class="w-7" alt="" />
								<p class="text-lg min-w-[100px]">{formatTime(modalData.authorScore)}</p>
								<Badge score={modalData.authorDifficulty} long={false} />

								<span
									class="bg-blue-100 text-blue-800 space-x-2 text-xs font-medium inline-flex items-center px-3 py-1.5 rounded"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-4 w-4"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
										<path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
									</svg>
									<span>{modalData.authorScorePosition.toLocaleString()} finishes</span>
								</span>
							</div>
							<div class="flex items-center space-x-3">
								<img src="/gold.png" class="w-7" alt="" />
								<p class="text-lg min-w-[100px]">{formatTime(modalData.goldScore)}</p>
								<Badge score={modalData.goldDifficulty} long={false} />

								<span
									class="bg-blue-100 text-blue-800 space-x-2 text-xs font-medium inline-flex items-center px-3 py-1.5 rounded"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-4 w-4"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
										<path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
									</svg>
									<span>{modalData.goldScorePosition.toLocaleString()} finishes</span>
								</span>
							</div>
							<div class="flex items-center space-x-3">
								<img src="/silver.png" class="w-7" alt="" />
								<p class="text-lg min-w-[100px]">{formatTime(modalData.silverScore)}</p>
								<Badge score={modalData.silverDifficulty} long={false} />

								<span
									class="bg-blue-100 text-blue-800 space-x-2 text-xs font-medium inline-flex items-center px-3 py-1.5 rounded"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-4 w-4"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
										<path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
									</svg>
									<span>{modalData.silverScorePosition.toLocaleString()} finishes</span>
								</span>
							</div>
							<div class="flex items-center space-x-3">
								<img src="/bronze.png" class="w-7" alt="" />
								<p class="text-lg min-w-[100px]">{formatTime(modalData.bronzeScore)}</p>
								<Badge score={modalData.bronzeDifficulty} long={false} />

								<span
									class="bg-blue-100 text-blue-800 space-x-2 text-xs font-medium inline-flex items-center px-3 py-1.5 rounded"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-4 w-4"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
										<path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
									</svg>
									<span>{modalData.bronzeScorePosition.toLocaleString()} finishes</span>
								</span>
							</div>
						</div>
					</div>

					<div>
						<h1 class="font-bold text-xl mb-2">Your Time</h1>

						{#if dataSet[modalData.$id].medal !== 0}
							<div class="flex items-center space-x-3">
								{#if dataSet[modalData.$id].medal === 4}
									<img src="/author.png" class="w-7" alt="" />
								{:else if dataSet[modalData.$id].medal === 3}
									<img src="/gold.png" class="w-7" alt="" />
								{:else if dataSet[modalData.$id].medal === 2}
									<img src="/silver.png" class="w-7" alt="" />
								{:else if dataSet[modalData.$id].medal === 1}
									<img src="/bronze.png" class="w-7" alt="" />
								{/if}

								<p class="text-lg min-w-[100px]">{formatTime(dataSet[modalData.$id].time)}</p>
							</div>
						{:else}
							<p class="text-lg min-w-[100px]">
								<span class="text-red-500 font-bold">NO MEDAL</span>
								<span>{formatTime(dataSet[modalData.$id].time)}</span>
							</p>
						{/if}
					</div>
				</div>

				<div class="flex items-center p-6 space-x-2 rounded-b border-t border-gray-200">
					<a
						target="_blank"
						href={`https://trackmania.io/#/totd/leaderboard/${modalData.seasonUid}/${modalData.mapUid}`}
					>
						<button
							data-modal-toggle="defaultModal"
							type="button"
							class="flex items-center space-x-2 text-white bg-author-600 hover:bg-author-700 focus:ring-4 focus:outline-none focus:ring-author-400 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
						>
							<p>Visit on Trackmania.io</p>
						</button>
					</a>
				</div>
			</div>
		</div>
	</div>
{/if}

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

			<div
				class="w-10 h-10 text-xs flex items-center justify-center rounded-full bg-gray-700 text-gray-400"
			>
				{finish}
			</div>
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
				<p>
					We don't have this profile yet. Click 'Update Profile' to start fetching data. This
					usually takes only a few seconds.
				</p>
			</div>
		</div>
	{/if}

	<div class="mt-6 flex flex-col md:flex-row items-center justify-between space-x-3">
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
			class="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 items-center justify-end"
		>
			<p class="text-slate-500">Last update <b class="font-bold">{lastUpdate}</b></p>

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

	<div class="mt-6 rounded-tl-3xl rounded-br-3xl bg-white border border-gray-200 p-4">
		<h1 class="font-bold text-black text-2xl mb-3">How to Read Data?</h1>

		<div class="prose">
			<p>Cells on website follow same color pallete as medals in Trackmania game.</p>
			<ul>
				<li class="text-author-500">
					Green is <b class="font-bold">Author Medal</b> worth <b class="font-bold">12 points</b>
				</li>
				<li class="text-gold-600">
					Yellow is <b class="font-bold">Gold Medal</b> worth <b class="font-bold">4 points</b>
				</li>
				<li class="text-silver-500">
					White is <b class="font-bold">Silver Medal</b> worth <b class="font-bold">2 points</b>
				</li>
				<li class="text-bronze-500">
					Orange is <b class="font-bold">Bronze Medal</b> worth <b class="font-bold">1 points</b>
				</li>
			</ul>

			{#if noMedalMaps !== null}
				<p>
					If you have finished a map but didn't get any medal, the cell has the same color as if you
					would never play the map. Try harder, you can do this! Here is a list of maps you finished
					but didn't get medal on:
				</p>
				<ul>
					{#each noMedalMaps as map}
						<li>
							<p>
								<button on:click={() => (modalData = map)} class="font-bold text-blue-500 underline"
									>{map.name}</button
								>

								<span class="ml-2 text-gray-400"> {map.$id} </span>
							</p>
						</li>
					{/each}

					{#if noMedalMaps.length <= 0}
						<li class="text-author-500">All maps are fine!</li>
					{/if}
				</ul>
			{/if}

			<p>
				New data is not fetched automatically. To request a data update, use 'Update Profile' button
				at the top of the page. This usually takes only a few seconds.
			</p>
			<p>
				Your score for year <strong>{currentYear}</strong> is
				<strong>{currentYearScore}/{maxPoints} points.</strong>
			</p>
		</div>
	</div>
</div>
