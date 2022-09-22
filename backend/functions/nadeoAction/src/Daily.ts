// deno-lint-ignore-file no-explicit-any

import { Auth } from "./Auth.ts";
import { download } from "https://deno.land/x/download/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";

import { getAxiod, sdk } from "./deps.ts";

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
        return dateTo.getMonth() - dateFrom.getMonth() +
            (12 * (dateTo.getFullYear() - dateFrom.getFullYear()))
    }

    static async getFinishers(mapUid: string, time: number) {
        const timeRes = await (await getAxiod()).get(`https://live-services.trackmania.nadeo.live/api/token/leaderboard/group/Personal_Best/map/${mapUid}/surround/0/0?score=${time}&onlyWorld=true`, {
            headers: {
                'User-Agent': 'tmstats.eu / 0.0.2 matejbaco2000@gmail.com',

                'Authorization': 'nadeo_v1 t=' + await Auth.Live.getToken(),
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        const position = timeRes.data.tops[0].top[0].position;

        return position;
    }

    static async fetchMap(dateKey: string, storage: sdk.Storage, existingDocument: any) {
        console.log("Fetching ", dateKey);

        const date = new Date(+dateKey.split("-")[2], (+dateKey.split("-")[1]) - 1, +dateKey.split("-")[0]);
        const offset = this.getOffset(date);

        const dailyRes = await (await getAxiod()).get("https://live-services.trackmania.nadeo.live/api/token/campaign/month?offset=" + offset + "&length=1", {
            headers: {
                'User-Agent': 'tmstats.eu / 0.0.2 matejbaco2000@gmail.com',

                'Authorization': 'nadeo_v1 t=' + await Auth.Live.getToken(),
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        const map = dailyRes.data.monthList[0].days.find((mapDay: any) => {
            const day = mapDay.monthDay;
            const month = dailyRes.data.monthList[0].month;
            const year = dailyRes.data.monthList[0].year;
            const localDateKey = `${day}-${month}-${year}`;

            return localDateKey === dateKey;
        });

        const mapUId = map.mapUid;

        if (mapUId === "") {
            console.log("Map not live yet");
            return null;
        }

        const mapIdsRes = await (await getAxiod()).get("https://prod.trackmania.core.nadeo.online/maps/?mapUidList=" + mapUId, {
            headers: {
                'User-Agent': 'tmstats.eu / 0.0.2 matejbaco2000@gmail.com',

                'Authorization': 'nadeo_v1 t=' + await Auth.Game.getToken(),
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        const mapIdData = mapIdsRes.data[0];

        const authorTimePlayersAmount = await Daily.getFinishers(mapUId, mapIdData.authorScore);
        const goldTimePlayersAmount = await Daily.getFinishers(mapUId, mapIdData.goldScore);
        const silverTimePlayersAmount = await Daily.getFinishers(mapUId, mapIdData.silverScore);
        const bronzeTimePlayersAmount = await Daily.getFinishers(mapUId, mapIdData.bronzeScore);
        const emptyTimePlayersAmount = await Daily.getFinishers(mapUId, mapIdData.bronzeScore * 3);
        const emptyTime2PlayersAmount = await Daily.getFinishers(mapUId, 86400000);

        const day = map.monthDay;
        const month = dailyRes.data.monthList[0].month;
        const year = dailyRes.data.monthList[0].year;

        let fileId;

        if (existingDocument) {
            fileId = existingDocument.thumbnailFileId;
        }

        if (!fileId) {
            const __dirname = new URL('.', import.meta.url).pathname;
            const filePath = path.join(__dirname, "../thumbnail.jpg");
            const fileFolderPath = path.join(__dirname, "../");

            await download(mapIdData.thumbnailUrl, {
                file: 'thumbnail.jpg',
                dir: fileFolderPath
            });

            const fileAppwrite = await storage.createFile('mapImages', 'unique()', sdk.InputFile.fromPath(filePath, "map.jpg"));
            await Deno.remove(filePath);

            fileId = fileAppwrite.$id
        }

        return {
            mapid: mapIdData.mapId,
            mapUid: mapIdData.mapUid,
            name: this.formatTMText(mapIdData.name),
            day,
            month,
            year,
            key: `${day}-${month}-${year}`,
            seasonUid: map.seasonUid,

            bronzeScore: mapIdData.bronzeScore,
            bronzeScorePosition: bronzeTimePlayersAmount,

            silverScore: mapIdData.silverScore,
            silverScorePosition: silverTimePlayersAmount,

            goldScore: mapIdData.goldScore,
            goldScorePosition: goldTimePlayersAmount,

            authorScore: mapIdData.authorScore,
            authorScorePosition: authorTimePlayersAmount,

            totalScorePositions: Math.max(emptyTimePlayersAmount, emptyTime2PlayersAmount),

            collectionName: this.formatTMText(mapIdData.collectionName),
            thumbnailFileId: fileId,
            createdAt: Date.now()
        }
    }

    static async fetchMissingMaps(db: sdk.Databases, storage: sdk.Storage): Promise<any[]> {
        const downloadedMaps = [];

        let hasNext = true;
        let offset = 0;
        do {
            const maps = await db.listDocuments<any>("dailyMaps", [], 100, offset);
            downloadedMaps.push(...maps.documents);

            hasNext = maps.documents.length > 0;
            offset += 100;
        } while (hasNext === true);

        /*
        // DEPRECATED MIGRATION TO FILL createdAt ATTRIBUTES
        for (const downloadedMap of downloadedMaps) {
            const d = new Date(+downloadedMap.year, +downloadedMap.month - 1, +downloadedMap.day);

            if (!downloadedMap.createdAt) {
                downloadedMap.createdAt = d.getTime();
            }

            await db.updateDocument("dailyMaps", downloadedMap.$id, downloadedMap);
        }
        */

        const missingKeys: string[] = [];

        const dateFrom = new Date(2020, 6, 1, 10);
        for (let dayTime = dateFrom.getTime(); dayTime < Date.now(); dayTime += 86400000) {
            const d = new Date(dayTime);
            const monthKey = `${d.getUTCMonth() + 1}-${d.getUTCFullYear()}`;
            const dayKey = `${d.getUTCDate()}-${monthKey}`;

            const downloadedMap = downloadedMaps.find((map: any) => map.key === dayKey);
            if (!downloadedMap || !downloadedMap.thumbnailFileId) {
                if (!missingKeys.includes(dayKey)) {
                    missingKeys.push(dayKey);
                }
            } else {
                const now = Date.now();
                const ago7Days = now - (1000 * 60 * 60 * 24 * 7);

                if (downloadedMap.totalScorePositions === 0 || downloadedMap.createdAt === 0 || dayTime >= ago7Days) {
                    if (!missingKeys.includes(dayKey)) {
                        missingKeys.push(dayKey);
                    }
                }
            }
        }

        console.log(missingKeys);

        const mapsData: any[] = [];

        for (const missingKey of missingKeys) {
            let existingDocument = null;
            try {
                existingDocument = await db.getDocument('dailyMaps', missingKey);
            } catch (err) {

            }

            const map = await this.fetchMap(missingKey, storage, existingDocument);
            if (map !== null && map.key) {
                mapsData.push(map.key);

                try {
                    await db.getDocument('dailyMaps', map.key);
                    await db.updateDocument('dailyMaps', map.key, map);
                } catch (_err) {
                    await db.createDocument('dailyMaps', map.key, map);
                }
            }
        }

        return mapsData;
    }

    static async getMedals(userId: string, db: sdk.Databases): Promise<any> {
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
                    'User-Agent': 'tmstats.eu / 0.0.2 matejbaco2000@gmail.com',

                    'Authorization': 'nadeo_v1 t=' + await Auth.Game.getToken(),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            medalsRes.data.forEach((medalData: any) => {
                const mapId = medalData.mapId;
                const mapInfo = mapData[mapId];

                responseData[mapInfo] = {
                    medal: medalData.medal,
                    time: medalData.recordScore.time
                };
            });
        }

        return responseData;
    }
}