// deno-lint-ignore-file no-explicit-any

import * as sdk from "https://deno.land/x/appwrite@3.0.0/mod.ts";
import { Auth } from "./Auth.ts";
import { Daily } from "./Daily.ts";
import axiod from "https://deno.land/x/axiod/mod.ts";

// https://players.trackmania.com/server/dedicated

/*
  'req' variable has:
    'headers' - object with request headers
    'payload' - object with request body data
    'env' - object with environment variables

  'res' variable has:
    'send(text, status)' - function to return text response. Status code defaults to 200
    'json(obj, status)' - function to return JSON response. Status code defaults to 200
  
  If an error is thrown, a response with code 500 will be returned.
*/

export let client: sdk.Client = null as any;
export let db: sdk.Database = null as any;

const func = async function (req: any, res: any) {
  if (
    !req.env['APPWRITE_FUNCTION_ENDPOINT'] ||
    !req.env['APPWRITE_FUNCTION_PROJECT_ID'] ||
    !req.env['APPWRITE_FUNCTION_API_KEY'] ||
    !req.env['NADE_AUTH'] ||
    !req.env['ADMIN_PASS']
  ) {
    return res.json({ message: "Missing environment variables", code: 500 });
  }

  const payload = JSON.parse(req.payload || '{}');

  if (!payload.type) {
    return res.json({ message: "Specify action type.", code: 500 });
  }

  const allowedTypes = ['getUserId', 'updateProfile'];

  if (!allowedTypes.includes(payload.type)) {
    return res.json({ message: "Action type not supported.", code: 500 });
  }

  client = new sdk.Client();
  db = new sdk.Database(client);

  client
    .setEndpoint(req.env['APPWRITE_FUNCTION_ENDPOINT'] as string)
    .setProject(req.env['APPWRITE_FUNCTION_PROJECT_ID'] as string)
    .setKey(req.env['APPWRITE_FUNCTION_API_KEY'] as string);

  const nadeoAuth = req.env['NADE_AUTH'] as string;

  if (!Auth.Live) {
    Auth.Live = new Auth("NadeoLiveServices", nadeoAuth);
    await Auth.Live.load();
  }

  if (!Auth.Game) {
    Auth.Game = new Auth("NadeoServices", nadeoAuth);
    await Auth.Game.load();
  }

  if (payload.type === 'getUserId') {
    if (!payload.nick) {
      return res.json({ message: "This action requires 'nick'.", code: 500 });
    }

    const tmRes = await axiod.get("https://trackmania.io/api/players/find?search=" + payload.nick, {
      headers: {
        'User-Agent': 'TM Daily Stats / 0.0.1 Private app'
      }
    });
    const bodyJson = tmRes.data;

    if (bodyJson.length <= 0) {
      return res.json({ message: "User with this nickname not found.", code: 500 });
    }

    const userId = bodyJson[0].player.id;

    return res.json({
      id: userId
    });
  }

  if (payload.type === 'updateProfile') {
    if (!payload.userId) {
      return res.json({ message: "This action requires 'userId'.", code: 500 });
    }

    let lastUpdate = null;

    try {
      const docRes = await db.getDocument<any>("profiles", payload.userId);
      lastUpdate = docRes.lastUpdate;
    } catch (_err) {
      // If error occured, and not admin, exit
      const adminPass = req.env['ADMIN_PASS'] as string;
      if (!payload.password || payload.password !== adminPass) {
        return res.json({ message: "Only administrator can add new players to leaderboard.", code: 500 });
      }
    }

    if (lastUpdate) {
      const now = Date.now();

      const h1 = 1000 * 60 * 60;
      if (lastUpdate + h1 > now) {
        const adminPass = req.env['ADMIN_PASS'] as string;
        if (!payload.password || payload.password !== adminPass) {
          return res.json({ message: "You can only refresh profile once every hour.", code: 500 });
        }
      }
    }

    let allMedals: any = {};
    const currentMonth = new Date().getMonth() + 1;
    for (let month = currentMonth; month > 0; month--) {
      const monthMedals = await Daily.getMedals(payload.userId, month);
      allMedals = Object.assign({}, allMedals, monthMedals);
    }

    let score = 0;
    let gold = 0;
    let author = 0;
    let silver = 0;
    let bronze = 0;

    for (const date in allMedals) {
      const medal = allMedals[date];

      if (medal === 1) {
        bronze++;
        score += 1;
      } else if (medal === 2) {
        silver++;
        score += 2;
      } else if (medal === 3) {
        gold++;
        score += 4;
      } else if (medal === 4) {
        author++;
        score += 8;
      }
    }

    const newDocData = {
      lastUpdate: Date.now(),
      medals: JSON.stringify(allMedals),
      score,
      gold,
      author,
      bronze,
      silver,
    }

    try {
      const docRes = await db.getDocument("profiles", payload.userId);
      const docId = docRes.$id;

      await db.updateDocument("profiles", docId, newDocData);
    } catch (_err) {
      await db.createDocument("profiles", payload.userId, newDocData);
    }

    return res.json({
      message: "Profile successfully updated!",
    });
  }

  res.json({
    action: "none",
  });
};

export default func;