// deno-lint-ignore-file no-explicit-any

import { Auth } from './Auth.ts';

import { getAxiod, sdk } from './deps.ts';

export class Daily {
	static formatTMText(str: string): string {
		let res, resStr;

		// Iterate through the string and check if there are $t,

		// First remplace all $T by $t and $Z by $z (for the regex)
		resStr = str.replace(/\$T/g, '$t').replace(/\$Z/g, '$z');

		// If there is a $t, it will be replaced by the text in uppercase until the $z or the end of the string
		while ((res = resStr.match(/\$t(.)*(\$z)|\$t(.)*$/g)) !== null) {
			for (let i = 0; i < res.length; i++) {
				resStr = resStr.replace(res[i], res[i].toUpperCase());
			}
		}

		// Check if there are two dollar signs in a row, returns one dollar sign
		resStr = resStr.replace(/\$\$/gi, '$');

		// Then remove all TM codes
		return resStr.replace(/\$[<>wnoisgtz]|\$[hl]\[(.)+\]|\$[hl]|\$[0-9a-fA-F]{3}/gi, '');
	}

	static getOffset(dateFrom = new Date(2020, 6, 1), dateTo = new Date()) {
		return (
			dateTo.getMonth() - dateFrom.getMonth() + 12 * (dateTo.getFullYear() - dateFrom.getFullYear())
		);
	}

	static async getFinishers(mapUid: string, time: number) {
		const timeRes = await (
			await getAxiod()
		).get(
			`https://live-services.trackmania.nadeo.live/api/token/leaderboard/group/Personal_Best/map/${mapUid}/surround/0/0?score=${time}&onlyWorld=true`,
			{
				headers: {
					'User-Agent': 'tmstats.almostapps.eu / 0.0.3 matejbaco2000@gmail.com',

					Authorization: 'nadeo_v1 t=' + (await Auth.Live.getToken()),
					Accept: 'application/json',
					'Content-Type': 'application/json'
				}
			}
		);

		const position = timeRes.data.tops[0].top[0].position;

		return position;
	}

	static async fetchMap(dateKey: string) {
		console.log('Fetching ', dateKey);

		const date = new Date(
			+dateKey.split('-')[2],
			+dateKey.split('-')[1] - 1,
			+dateKey.split('-')[0]
		);
		const offset = this.getOffset(date);

		const dailyRes = await (
			await getAxiod()
		).get(
			'https://live-services.trackmania.nadeo.live/api/token/campaign/month?offset=' +
				offset +
				'&length=1',
			{
				headers: {
					'User-Agent': 'tmstats.almostapps.eu / 0.0.3 matejbaco2000@gmail.com',

					Authorization: 'nadeo_v1 t=' + (await Auth.Live.getToken()),
					Accept: 'application/json',
					'Content-Type': 'application/json'
				}
			}
		);

		const map = dailyRes.data.monthList[0].days.find((mapDay: any) => {
			const day = mapDay.monthDay;
			const month = dailyRes.data.monthList[0].month;
			const year = dailyRes.data.monthList[0].year;
			const localDateKey = `${day}-${month}-${year}`;

			return localDateKey === dateKey;
		});

		const mapUId = map.mapUid;

		if (mapUId === '') {
			console.log('Map not live yet');
			return null;
		}

		const mapIdsRes = await (
			await getAxiod()
		).get('https://prod.trackmania.core.nadeo.online/maps/?mapUidList=' + mapUId, {
			headers: {
				'User-Agent': 'tmstats.almostapps.eu / 0.0.3 matejbaco2000@gmail.com',

				Authorization: 'nadeo_v1 t=' + (await Auth.Game.getToken()),
				Accept: 'application/json',
				'Content-Type': 'application/json'
			}
		});

		const mapIdData = mapIdsRes.data[0];

		const day = map.monthDay;
		const month = dailyRes.data.monthList[0].month;
		const year = dailyRes.data.monthList[0].year;

		return {
			mapid: mapIdData.mapId,
			mapUid: mapIdData.mapUid,
			name: this.formatTMText(mapIdData.name),
			day,
			month,
			year,
			key: `${day}-${month}-${year}`,

			bronzeScore: mapIdData.bronzeScore,

			silverScore: mapIdData.silverScore,

			goldScore: mapIdData.goldScore,

			authorScore: mapIdData.authorScore,

			collectionName: this.formatTMText(mapIdData.collectionName),
			thumbnailUrl: mapIdData.thumbnailUrl
		};
	}

	static async fetchMissingMaps(db: sdk.Databases): Promise<any[]> {
		const downloadedMaps = [];

		let cursor = null;
		do {
			const queries = [sdk.Query.limit(100)];

			if (cursor) {
				queries.push(sdk.Query.cursorAfter(cursor));
			}

			const maps = await db.listDocuments<any>('default', 'dailyMaps', queries);
			downloadedMaps.push(...maps.documents);

			if (maps.documents.length > 0) {
				cursor = maps.documents[maps.documents.length - 1].$id;
			} else {
				cursor = null;
			}
		} while (cursor !== null);

		const missingKeys: string[] = [];

		const dateFrom = new Date(2020, 6, 1, 10);
		for (let dayTime = dateFrom.getTime(); dayTime < Date.now(); dayTime += 86400000) {
			const d = new Date(dayTime);
			const monthKey = `${d.getUTCMonth() + 1}-${d.getUTCFullYear()}`;
			const dayKey = `${d.getUTCDate()}-${monthKey}`;

			const downloadedMap = downloadedMaps.find((map: any) => map.key === dayKey);
			if (!downloadedMap) {
				if (!missingKeys.includes(dayKey)) {
					missingKeys.push(dayKey);
				}
			} else {
				const now = Date.now();
				const ago7Days = now - 1000 * 60 * 60 * 24 * 7;

				if (dayTime >= ago7Days) {
					if (!missingKeys.includes(dayKey)) {
						missingKeys.push(dayKey);
					}
				}
			}
		}

		const mapsData: any[] = [];

		for (const missingKey of missingKeys) {
			const map = await this.fetchMap(missingKey);
			if (map !== null && map.key) {
				mapsData.push(map.key);

				try {
					await db.getDocument('default', 'dailyMaps', map.key);
					await db.updateDocument('default', 'dailyMaps', map.key, map);
				} catch (_err) {
					await db.createDocument('default', 'dailyMaps', map.key, map);
				}
			}
		}

		return mapsData;
	}

	static async fetchMissingMapsWeekly(db: sdk.Databases): Promise<any[]> {
		const fetchedIds: any = [];

		const downloadedMaps = [];

		let cursor = null;
		do {
			const queries = [sdk.Query.limit(100)];

			if (cursor) {
				queries.push(sdk.Query.cursorAfter(cursor));
			}

			const maps = await db.listDocuments<any>('default', 'weeklyMaps', queries);
			downloadedMaps.push(...maps.documents);

			if (maps.documents.length > 0) {
				cursor = maps.documents[maps.documents.length - 1].$id;
			} else {
				cursor = null;
			}
		} while (cursor !== null);

		const downloadedMapKeys = downloadedMaps.map((d: any) => d.key);

		let offset = 0;
		while (offset < 100) {
			const weeklyRes = await (
				await getAxiod()
			).get(
				'https://live-services.trackmania.nadeo.live/api/campaign/weekly-shorts?length=1&offset=' +
					offset,
				{
					headers: {
						'User-Agent': 'tmstats.almostapps.eu / 0.0.3 matejbaco2000@gmail.com',
						Authorization: 'nadeo_v1 t=' + (await Auth.Live.getToken()),
						Accept: 'application/json'
					}
				}
			);

			if (weeklyRes.data.campaignList.length === 0) {
				break;
			}

			const { year, week } = weeklyRes.data.campaignList[0];

			console.log('Fetching year ' + year + ', week ' + week);

			for (const map of weeklyRes.data.campaignList[0].playlist) {
				const mapUid = map.mapUid;
				const position = map.position;

				const exists = downloadedMapKeys.includes(`${position}-${week}-${year}`);
				if (exists && offset > 1) {
					break;
				}

				console.log('Fetching map ' + mapUid);

				const mapIdRes = await (
					await getAxiod()
				).get('https://live-services.trackmania.nadeo.live/api/token/map/' + mapUid, {
					headers: {
						'User-Agent': 'tmstats.almostapps.eu / 0.0.3 matejbaco2000@gmail.com',
						Authorization: 'nadeo_v1 t=' + (await Auth.Live.getToken()),
						Accept: 'application/json'
					}
				});

				const mapId = mapIdRes.data.mapId;

				const mapName = mapIdRes.data.name;
				const mapThumbnail = mapIdRes.data.thumbnailUrl;
				const mapCollection = mapIdRes.data.collectionName;
				const mapAuthorTime = mapIdRes.data.authorTime;
				const mapGoldTime = mapIdRes.data.goldTime;
				const mapSilverTime = mapIdRes.data.silverTime;
				const mapBronzeTime = mapIdRes.data.bronzeTime;

				const doc = {
					mapid: mapId,
					mapUid: mapUid,
					name: this.formatTMText(mapName),
					position,
					week,
					year,
					key: `${position}-${week}-${year}`,

					bronzeScore: mapBronzeTime,

					silverScore: mapSilverTime,

					goldScore: mapGoldTime,

					authorScore: mapAuthorTime,

					collectionName: this.formatTMText(mapCollection),
					thumbnailUrl: mapThumbnail
				};

				fetchedIds.push(doc.key);

				try {
					await db.getDocument('default', 'weeklyMaps', doc.key);
					await db.updateDocument('default', 'weeklyMaps', doc.key, doc);
				} catch (_err) {
					await db.createDocument('default', 'weeklyMaps', doc.key, doc);
				}
			}

			offset++;
		}

		return fetchedIds;
	}

	static async fetchMissingMapsCampaign(db: sdk.Databases): Promise<any[]> {
		const fetchedIds: any = [];

		const downloadedMaps = [];

		let cursor = null;
		do {
			const queries = [sdk.Query.limit(100)];

			if (cursor) {
				queries.push(sdk.Query.cursorAfter(cursor));
			}

			const maps = await db.listDocuments<any>('default', 'campaignMaps', queries);
			downloadedMaps.push(...maps.documents);

			if (maps.documents.length > 0) {
				cursor = maps.documents[maps.documents.length - 1].$id;
			} else {
				cursor = null;
			}
		} while (cursor !== null);

		const downloadedMapKeys = downloadedMaps.map((d: any) => d.key);

		let offset = 0;
		while (offset < 100) {
			const weeklyRes = await (
				await getAxiod()
			).get(
				'https://live-services.trackmania.nadeo.live/api/campaign/official?length=1&offset=' +
					offset,
				{
					headers: {
						'User-Agent': 'tmstats.almostapps.eu / 0.0.3 matejbaco2000@gmail.com',
						Authorization: 'nadeo_v1 t=' + (await Auth.Live.getToken()),
						Accept: 'application/json'
					}
				}
			);

			if (weeklyRes.data.campaignList.length === 0) {
				break;
			}

			const { name: campaignName } = weeklyRes.data.campaignList[0];

			const campaignUid = campaignName.split(' ').join('-').toLowerCase();

			console.log('Fetching ' + campaignUid);

			for (const map of weeklyRes.data.campaignList[0].playlist) {
				const mapUid = map.mapUid;
				const position = map.position;

				const exists = downloadedMapKeys.includes(`${position}-${campaignUid}`);
				if (exists) {
					// && offset > 0
					break;
				}

				console.log('Fetching map ' + mapUid);

				const mapIdRes = await (
					await getAxiod()
				).get('https://live-services.trackmania.nadeo.live/api/token/map/' + mapUid, {
					headers: {
						'User-Agent': 'tmstats.almostapps.eu / 0.0.3 matejbaco2000@gmail.com',
						Authorization: 'nadeo_v1 t=' + (await Auth.Live.getToken()),
						Accept: 'application/json'
					}
				});

				const mapId = mapIdRes.data.mapId;

				const mapName = mapIdRes.data.name;
				const mapThumbnail = mapIdRes.data.thumbnailUrl;
				const mapCollection = mapIdRes.data.collectionName;
				const mapAuthorTime = mapIdRes.data.authorTime;
				const mapGoldTime = mapIdRes.data.goldTime;
				const mapSilverTime = mapIdRes.data.silverTime;
				const mapBronzeTime = mapIdRes.data.bronzeTime;

				const doc = {
					mapid: mapId,
					mapUid: mapUid,
					name: this.formatTMText(mapName),
					position,
					campaignUid: `${campaignUid}`,

					key: `${position}-${campaignUid}`,

					bronzeScore: mapBronzeTime,

					silverScore: mapSilverTime,

					goldScore: mapGoldTime,

					authorScore: mapAuthorTime,

					collectionName: this.formatTMText(mapCollection),
					thumbnailUrl: mapThumbnail
				};

				fetchedIds.push(doc.key);

				try {
					await db.getDocument('default', 'campaignMaps', doc.key);
					await db.updateDocument('default', 'campaignMaps', doc.key, doc);
				} catch (_err) {
					await db.createDocument('default', 'campaignMaps', doc.key, doc);
				}
			}

			offset++;
		}

		return fetchedIds;
	}

	static async getMedals(
		userId: string,
		db: sdk.Databases,
		year: number,
		month: number
	): Promise<any> {
		const downloadedMaps: any[] = [];

		let cursor = null;
		do {
			const queries = [
				sdk.Query.limit(100),
				sdk.Query.equal('year', year),
				sdk.Query.equal('month', month)
			];

			if (cursor) {
				queries.push(sdk.Query.cursorAfter(cursor));
			}

			const maps = await db.listDocuments('default', 'dailyMaps', queries);
			downloadedMaps.push(...maps.documents);

			if (maps.documents.length > 0) {
				cursor = maps.documents[maps.documents.length - 1].$id;
			} else {
				cursor = null;
			}
		} while (cursor !== null);

		const mapIdList = downloadedMaps.map((d: any) => d.mapid);

		const mapData: any = {};

		downloadedMaps.forEach((map: any) => {
			mapData[map.mapid] = 'cotd-' + map.key;
		});

		const responseData: any = {};

		for (const mapId of mapIdList) {
			const mapInfo = mapData[mapId];
			console.log('Fetching ' + mapInfo);

			const medalsRes = await (
				await getAxiod()
			).get(
				'https://prod.trackmania.core.nadeo.online/mapRecords/?accountIdList=' +
					userId +
					'&mapIdList=' +
					mapId,
				{
					headers: {
						'User-Agent': 'tmstats.almostapps.eu / 0.0.3 matejbaco2000@gmail.com',
						Authorization: 'nadeo_v1 t=' + (await Auth.Game.getToken()),
						Accept: 'application/json',
						'Content-Type': 'application/json'
					}
				}
			);

			const medalData = medalsRes.data[0];

			if (medalData) {
				responseData[mapInfo] = {
					medal: medalData.medal,
					time: medalData.recordScore.time
				};
			}
		}

		return responseData;
	}

	static async getMedalsShorts(
		userId: string,
		db: sdk.Databases,
		year: number,
		week: number
	): Promise<any> {
		const downloadedMaps: any[] = [];

		let cursor = null;
		do {
			const queries = [
				sdk.Query.limit(100),
				sdk.Query.equal('year', year),
				sdk.Query.equal('week', week)
			];

			if (cursor) {
				queries.push(sdk.Query.cursorAfter(cursor));
			}

			const maps = await db.listDocuments('default', 'weeklyMaps', queries);
			downloadedMaps.push(...maps.documents);

			if (maps.documents.length > 0) {
				cursor = maps.documents[maps.documents.length - 1].$id;
			} else {
				cursor = null;
			}
		} while (cursor !== null);

		const mapIdList = downloadedMaps.map((d: any) => d.mapid);

		const mapData: any = {};

		downloadedMaps.forEach((map: any) => {
			mapData[map.mapid] = 'shorts-' + map.key;
		});

		const responseData: any = {};

		for (const mapId of mapIdList) {
			const mapInfo = mapData[mapId];
			console.log('Fetching ' + mapInfo);

			const medalsRes = await (
				await getAxiod()
			).get(
				'https://prod.trackmania.core.nadeo.online/mapRecords/?accountIdList=' +
					userId +
					'&mapIdList=' +
					mapId,
				{
					headers: {
						'User-Agent': 'tmstats.almostapps.eu / 0.0.3 matejbaco2000@gmail.com',
						Authorization: 'nadeo_v1 t=' + (await Auth.Game.getToken()),
						Accept: 'application/json',
						'Content-Type': 'application/json'
					}
				}
			);

			const medalData = medalsRes.data[0];

			if (medalData) {
				responseData[mapInfo] = {
					medal: medalData.medal,
					time: medalData.recordScore.time
				};
			}
		}

		return responseData;
	}

	static async getMedalsCampaign(
		userId: string,
		db: sdk.Databases,
		campaignUid: string
	): Promise<any> {
		const downloadedMaps: any[] = [];

		let cursor = null;
		do {
			const queries = [sdk.Query.limit(100), sdk.Query.equal('campaignUid', campaignUid)];

			if (cursor) {
				queries.push(sdk.Query.cursorAfter(cursor));
			}

			const maps = await db.listDocuments('default', 'campaignMaps', queries);
			downloadedMaps.push(...maps.documents);

			if (maps.documents.length > 0) {
				cursor = maps.documents[maps.documents.length - 1].$id;
			} else {
				cursor = null;
			}
		} while (cursor !== null);

		const mapIdList = downloadedMaps.map((d: any) => d.mapid);

		const mapData: any = {};

		downloadedMaps.forEach((map: any) => {
			mapData[map.mapid] = 'campaign-' + map.key;
		});

		const responseData: any = {};

		for (const mapId of mapIdList) {
			const mapInfo = mapData[mapId];
			console.log('Fetching ' + mapInfo);

			const medalsRes = await (
				await getAxiod()
			).get(
				'https://prod.trackmania.core.nadeo.online/mapRecords/?accountIdList=' +
					userId +
					'&mapIdList=' +
					mapId,
				{
					headers: {
						'User-Agent': 'tmstats.almostapps.eu / 0.0.3 matejbaco2000@gmail.com',
						Authorization: 'nadeo_v1 t=' + (await Auth.Game.getToken()),
						Accept: 'application/json',
						'Content-Type': 'application/json'
					}
				}
			);

			const medalData = medalsRes.data[0];

			if (medalData) {
				responseData[mapInfo] = {
					medal: medalData.medal,
					time: medalData.recordScore.time
				};
			}
		}

		return responseData;
	}
}
