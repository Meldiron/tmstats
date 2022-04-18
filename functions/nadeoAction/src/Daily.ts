// deno-lint-ignore-file no-explicit-any

import { Auth } from "./Auth.ts";
import { getAxiod, sdk } from "./deps.ts";

export class Daily {
    static getOffset(dateFrom = new Date(2020, 6, 1), dateTo = new Date()) {
        return dateTo.getMonth() - dateFrom.getMonth() +
            (12 * (dateTo.getFullYear() - dateFrom.getFullYear()))
    }

    static async getMissingMaps(db: sdk.Database): Promise<any[]> {
        const downloadedMaps = [];

        let hasNext = true;
        let offset = 0;
        do {
            const maps = await db.listDocuments("dailyMaps", [], 100, offset);
            downloadedMaps.push(...maps.documents);

            hasNext = maps.documents.length > 0;
            offset += 100;
        } while (hasNext === true);

        const missingKeys: string[] = [];
        const missingMonths: string[] = [];

        const dateFrom = new Date(2020, 6, 1);
        for (let dayTime = dateFrom.getTime(); dayTime < Date.now(); dayTime += 86400000) {
            const d = new Date(dayTime);
            const monthKey = `${d.getMonth() + 1}-${d.getFullYear()}`;
            const dayKey = `${d.getDate()}-${monthKey}`;

            const downloadedMap = downloadedMaps.find((map: any) => map.key === dayKey);
            if (!downloadedMap) {
                if (!missingKeys.includes(dayKey)) {

                    missingKeys.push(dayKey);
                }

                if (!missingMonths.includes(monthKey)) {
                    missingMonths.push(monthKey);
                }
            }
        }

        const mapsData: any[] = [];

        const missingOffsets = missingMonths.map((monthKey) => {
            const date = new Date(+monthKey.split("-")[1], (+monthKey.split("-")[0]) - 1, 1);
            return this.getOffset(date);
        });

        for (const offset of missingOffsets) {
            const dailyRes = await (await getAxiod()).get("https://live-services.trackmania.nadeo.live/api/token/campaign/month?offset=" + offset + "&length=1", {
                headers: {
                    'User-Agent': 'tm.matejbaco.eu / 0.0.1 matejbaco2000@gmail.com',

                    'Authorization': 'nadeo_v1 t=' + await Auth.Live.getToken(),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            dailyRes.data.monthList[0].days = dailyRes.data.monthList[0].days.filter((mapDay: any) => {
                const day = mapDay.monthDay;
                const month = dailyRes.data.monthList[0].month;
                const year = dailyRes.data.monthList[0].year;
                const dateKey = `${day}-${month}-${year}`;

                return missingKeys.includes(dateKey);
            });

            const mapUIdList = dailyRes.data.monthList[0].days.map((d: any) => d.mapUid).filter((id: string) => id !== "");

            const mapIdsRes = await (await getAxiod()).get("https://prod.trackmania.core.nadeo.online/maps/?mapUidList=" + mapUIdList.join(","), {
                headers: {
                    'User-Agent': 'tm.matejbaco.eu / 0.0.1 matejbaco2000@gmail.com',

                    'Authorization': 'nadeo_v1 t=' + await Auth.Game.getToken(),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            const maps: any[] = mapIdsRes.data.map((map: any) => {
                const mapDay = dailyRes.data.monthList[0].days.find((d: any) => d.mapUid === map.mapUid);

                const day = mapDay.monthDay;
                const month = dailyRes.data.monthList[0].month;
                const year = dailyRes.data.monthList[0].year;

                return {
                    mapid: map.mapId,
                    mapUid: map.mapUid,
                    day,
                    month,
                    year,
                    key: `${day}-${month}-${year}`,
                }
            });

            for (const map of maps) {
                mapsData.push(map);
            }
        }

        return mapsData;
    }

    static async getMedals(userId: string, db: sdk.Database): Promise<any> {
        const downloadedMaps: any[] = [];

        let hasNext = true;
        let offset = 0;
        do {
            const maps = await db.listDocuments("dailyMaps", [], 100, offset);
            downloadedMaps.push(...maps.documents);

            hasNext = maps.documents.length > 0;
            offset += 100;
        } while (hasNext === true);

        const mapIdList = downloadedMaps.map((d: any) => d.mapid);

        const mapData: any = {};

        downloadedMaps.forEach((map: any) => {
            mapData[map.mapid] = map.key;
        });

        const chunkSize = 200;

        const responseData: any = {};

        for (let i = 0; i < mapIdList.length; i += chunkSize) {
            const chunkOfIds = mapIdList.slice(i, i + chunkSize);

            const medalsRes = await (await getAxiod()).get("https://prod.trackmania.core.nadeo.online/mapRecords/?accountIdList=" + userId + "&mapIdList=" + chunkOfIds.join(","), {
                headers: {
                    'User-Agent': 'tm.matejbaco.eu / 0.0.1 matejbaco2000@gmail.com',

                    'Authorization': 'nadeo_v1 t=' + await Auth.Game.getToken(),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            medalsRes.data.forEach((medalData: any) => {
                const mapId = medalData.mapId;
                const mapInfo = mapData[mapId];

                responseData[mapInfo] = medalData.medal;
            });
        }

        return responseData;
    }
}