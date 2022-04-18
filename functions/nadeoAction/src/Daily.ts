// deno-lint-ignore-file no-explicit-any

import { Auth } from "./Auth.ts";
import { getAxiod } from "./deps.ts";

export class Daily {
    static getOffset(dateFrom = new Date(2020, 6, 1), dateTo = new Date()) {
        return dateTo.getMonth() - dateFrom.getMonth() +
            (12 * (dateTo.getFullYear() - dateFrom.getFullYear()))
    }

    static async getMedals(userId: string, offset = 0, outData = {}): Promise<any> {
        const dailyRes = await (await getAxiod()).get("https://live-services.trackmania.nadeo.live/api/token/campaign/month?offset=" + offset + "&length=1", {
            headers: {
                'User-Agent': 'tm.matejbaco.eu / 0.0.1 matejbaco2000@gmail.com',

                'Authorization': 'nadeo_v1 t=' + await Auth.Live.getToken(),
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
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

        const mapIdList = mapIdsRes.data.map((d: any) => d.mapId).filter((id: string) => id !== "");

        const mapData: any = {};

        mapIdList.forEach((id: string) => {
            const mapAll = mapIdsRes.data.find((map: any) => map.mapId === id);
            const mapUid = mapAll.mapUid;

            const seasonMap = dailyRes.data.monthList[0].days.find((d: any) => d.mapUid === mapUid);

            const day = seasonMap.monthDay;
            const month = dailyRes.data.monthList[0].month;
            const year = dailyRes.data.monthList[0].year;

            mapData[id] = `${day}-${month}-${year}`;
        });

        const medalsRes = await (await getAxiod()).get("https://prod.trackmania.core.nadeo.online/mapRecords/?accountIdList=" + userId + "&mapIdList=" + mapIdList.join(","), {
            headers: {
                'User-Agent': 'tm.matejbaco.eu / 0.0.1 matejbaco2000@gmail.com',

                'Authorization': 'nadeo_v1 t=' + await Auth.Game.getToken(),
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        const responseData: any = {};

        medalsRes.data.forEach((medalData: any) => {
            const mapId = medalData.mapId;
            const mapInfo = mapData[mapId];

            responseData[mapInfo] = medalData.medal;
        });

        outData = Object.assign({}, outData, responseData);

        const maxOffset = this.getOffset();

        if (offset >= maxOffset) {
            return outData;
        } else {
            return await this.getMedals(userId, offset + 1, outData);
        }

    }
}