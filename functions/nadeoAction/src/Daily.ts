// deno-lint-ignore-file no-explicit-any

import { Auth } from "./Auth.ts";
import axiod from "https://deno.land/x/axiod/mod.ts";

export class Daily {
    static async getMedals(userId: string, month: number) {
        const currentMonth = new Date().getMonth() + 1;
        const offset = Math.abs(currentMonth - month);

        const dailyRes = await axiod.get("https://live-services.trackmania.nadeo.live/api/token/campaign/month?offset=" + offset + "&length=1", {
            headers: {
                'Authorization': 'nadeo_v1 t=' + await Auth.Live.getToken(),
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        const mapUIdList = dailyRes.data.monthList[0].days.map((d: any) => d.mapUid).filter((id: string) => id !== "");

        const mapIdsRes = await axiod.get("https://prod.trackmania.core.nadeo.online/maps/?mapUidList=" + mapUIdList.join(","), {
            headers: {
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

        const medalsRes = await axiod.get("https://prod.trackmania.core.nadeo.online/mapRecords/?accountIdList=" + userId + "&mapIdList=" + mapIdList.join(","), {
            headers: {
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

        return responseData;
    }
}