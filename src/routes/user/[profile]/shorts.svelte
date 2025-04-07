<script lang="ts">
	import Instructions from '$lib/instructions.svelte';
	import { AppwriteService } from '../../../appwrite';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let profileId;
	page.subscribe(async () => {
		profileId = $page.params.profile;
	});

	function formatTime(ms: number) {
		const mins = Math.floor(ms / 1000 / 60);
		ms -= mins * 1000 * 60;
		const secs = Math.floor(ms / 1000);
		ms -= secs * 1000;

		return `${mins < 10 ? '0' + mins : mins}:${secs < 10 ? '0' + secs : secs}.${
			ms > 99 ? ms : '0' + ms
		}`;
	}

	let modalData = null;

	const cursor = {
		visible: false,
		left: 0,
		top: 0,
		data: {} as any
	};

	// TODO: More exact placement
	function mouseEnter(event: any, map: any) {
		cursor.visible = true;
		cursor.left = event.x;
		cursor.top = event.y;
		cursor.data = {
			text: map.name
		};
	}

	function mouseLeave() {
		cursor.visible = false;
	}

	function mouseDown(map: any) {
		const record = (recordsMap[getWeekName(map.key)] ?? [])[map.position];

		modalData = {
			raw: {
				time: record?.medal?.time ?? 0,
				medal: record?.medal?.medal ?? 0
			},
			mapData: map
		};
	}

	let isLoading = false;
	async function updateData(uid: string) {
		if (isLoading) {
			return;
		}

		isLoading = true;

		const [week, year] = uid.split('-');

		try {
			const res = await AppwriteService.nadeoAction(profileId, 'shorts', +year, undefined, +week);

			if (res) {
				onMountFunction();
			}
		} finally {
			isLoading = false;
		}
	}

	let profileName = '...';

	let silver = 0;
	let bronze = 0;
	let gold = 0;
	let author = 0;
	let totalPoints = 0;

	let weeks = [];
	let recordsMap: any = {};
	let mapsMap: any = {};

	const categories = [
		{ name: 'Track of the day', url: '/cotd/' + new Date().getFullYear(), current: false },
		{ name: 'Weekly shorts', url: '/shorts', current: true },
		{ name: 'Campaign', url: '/campaign', current: false }
	];

	let didFail = null;

	const onMountFunction = async () => {
		silver = 0;
		bronze = 0;
		gold = 0;
		author = 0;
		totalPoints = 0;

		weeks = [];
		recordsMap = {};
		mapsMap = {};

		let weeksRes = await AppwriteService.getWeeklyMaps();

		for (const map of weeksRes) {
			const [_position, weekName, yearName] = map.key.split('-');
			const weekUid = weekName + '-' + yearName;

			if (!weeks.includes(weekUid)) {
				weeks.push(weekUid);
			}

			if (!mapsMap[weekUid]) {
				mapsMap[weekUid] = [];
			}

			mapsMap[weekUid].push(map);
		}
		
		weeks = weeks.sort((a, b) => {
			const [weekA, yearA] = a.split('-');
			const [weekB, yearB] = b.split('-');
			return yearB - yearA || weekB - weekA;
		});

		weeks = weeks;
		mapsMap = mapsMap;

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

		for (const key of Object.keys(dbRes.medals)) {
			if (!key.startsWith('shorts-')) {
				continue;
			}

			const [_type, _position, uid1, uid2] = key.split('-');
			const uid = uid1 + '-' + uid2; // week-year

			const medal = dbRes.medals[key];

			if (!recordsMap[uid]) {
				recordsMap[uid] = [];
			}

			recordsMap[uid].push({
				medal
			});
		}
	};

	onMount(onMountFunction);

	function getWeekName(map: string) {
		const [_position, uid1, uid2] = map.split('-');
		return uid1 + '-' + uid2; // week-year
	}
</script>

{#if cursor.visible}
	<div
		style={'left: ' + cursor.left + 'px; top: ' + (cursor.top - 10) + 'px'}
		class="fixed z-20 text-center left-40 top-40 bg-slate-900  border border-slate-600 rounded-tl-xl rounded-br-xl px-3 py-1 text-white transform -translate-x-1/2 -translate-y-full pointer-events-none"
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
					<h3 class="text-xl font-semibold text-gray-900">{modalData.mapData.name}</h3>
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
							src={modalData.mapData.thumbnailUrl}
							class="w-full h-full object-cover object-center"
							alt=""
						/>
					</div>
				</div>

				<div class="pt-0 p-6 space-y-6">
					<div class="block">
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
							<span>{modalData.mapData.$id}</span>
						</span>
					</div>

					<div>
						<h1 class="font-bold text-xl mb-2">Medal Times</h1>

						<div class="flex flex-col space-y-4">
							<div class="flex items-center space-x-3">
								<img src="/author.png" class="w-7" alt="" />
								<p class="text-lg min-w-[100px]">{formatTime(modalData.mapData.authorScore)}</p>
							</div>
							<div class="flex items-center space-x-3">
								<img src="/gold.png" class="w-7" alt="" />
								<p class="text-lg min-w-[100px]">{formatTime(modalData.mapData.goldScore)}</p>
							</div>
							<div class="flex items-center space-x-3">
								<img src="/silver.png" class="w-7" alt="" />
								<p class="text-lg min-w-[100px]">{formatTime(modalData.mapData.silverScore)}</p>
							</div>
							<div class="flex items-center space-x-3">
								<img src="/bronze.png" class="w-7" alt="" />
								<p class="text-lg min-w-[100px]">{formatTime(modalData.mapData.bronzeScore)}</p>
							</div>
						</div>
					</div>

					<div>
						<h1 class="font-bold text-xl mb-2">Your Time</h1>

						{#if modalData.raw && modalData.raw.medal !== 0}
							<div class="flex items-center space-x-3">
								{#if modalData.raw.medal === 4}
									<img src="/author.png" class="w-7" alt="" />
								{:else if modalData.raw.medal === 3}
									<img src="/gold.png" class="w-7" alt="" />
								{:else if modalData.raw.medal === 2}
									<img src="/silver.png" class="w-7" alt="" />
								{:else if modalData.raw.medal === 1}
									<img src="/bronze.png" class="w-7" alt="" />
								{/if}

								<p class="text-lg min-w-[100px]">
									{modalData.raw.time ? formatTime(modalData.raw.time) : 'N/A'}
								</p>
							</div>
						{:else}
							<p class="text-lg min-w-[100px]">
								<span class="text-red-500 font-bold">NO MEDAL</span>

								{#if modalData.raw}
									<span>{modalData.raw.time ? formatTime(modalData.raw.time) : 'N/A'}</span>
								{/if}
							</p>
						{/if}
					</div>
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

	<div class="grid grid-cols-12 gap-6 mt-6">
		{#each weeks as week}
			<section
				class="relative border border-gray-900 p-4 bg-gray-800 rounded-tl-3xl rounded-br-3xl col-span-6 sm:col-span-6 md:col-span-4 lg:col-span-4"
			>
				<div class="flex items-center justify-between">
					<h3 class="font-bold text-2xl text-gray-200">
						Week {week.split('-')[0]}
					</h3>
					<div>
						<button
							disabled={isLoading}
							on:click={() => updateData(week)}
							class="disabled:opacity-50 rounded-tl-2xl rounded-br-2xl text-white bg-gray-700 enabled:hover:bg-gray-600 py-2 px-4 font-bold"
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
					</div>
				</div>

				<h4 class="-mt-1 font-semibold text-gray-400 mb-3">Year {week.split('-')[1]}</h4>

				<div class="flex flex-wrap gap-2">
					{#each mapsMap[week] as map}
						{@const medal =
							(recordsMap[getWeekName(map.key)] ?? [])[map.position]?.medal?.medal ?? 0}
						<button
							on:mouseleave={() => mouseLeave()}
							on:mousedown={() => mouseDown(map)}
							on:mouseenter={(event) => mouseEnter(event, map)}
							class={`${
								medal === 4
									? 'bg-[#14b583]'
									: medal === 3
									? 'bg-[#ffd700]'
									: medal === 2
									? 'bg-[#e0e0e0]'
									: medal === 1
									? 'bg-[#cd7f32]'
									: 'bg-[#374151]'
							} rounded-tl-lg rounded-br-lg w-6 h-6`}
						/>
					{/each}
				</div>
			</section>
		{/each}
	</div>

	<Instructions />
</div>
