// deno-lint-ignore-file no-explicit-any

import { Auth } from "./Auth.ts";
import { Daily } from "./Daily.ts";
import { getAxiod, sdk, RateLimiter } from "./deps.ts";

// https://players.trackmania.com/server/dedicated

RateLimiter.Limiter = new RateLimiter();

let timeoutCache: any = {};

setInterval(() => {
  timeoutCache = {};
}, 60000 * 5);

let client: sdk.Client = null as any;
let db: sdk.Databases = null as any;

const func = async function (context: any) {
  if (
    !Deno.env.get('NADE_AUTH')
  ) {
    return context.res.json({ message: "Missing environment variables", code: 500 });
  }

  const appwriteUserId = context.req.headers['x-appwrite-user-id'] as string;

  const payload = JSON.parse(context.req.bodyText || '{}');

  client = new sdk.Client();
  db = new sdk.Databases(client);

  client
    .setEndpoint(Deno.env.get('APPWRITE_FUNCTION_API_ENDPOINT') as string)
    .setProject(Deno.env.get('APPWRITE_FUNCTION_PROJECT_ID') as string)
    .setKey(context.req.headers['x-appwrite-key'] as string);

  const nadeoAuth = Deno.env.get('NADE_AUTH') as string;

  if (!Auth.Live) {
    Auth.Live = new Auth(db, "NadeoLiveServices", nadeoAuth);
    await Auth.Live.load();
  }

  if (!Auth.Game) {
    Auth.Game = new Auth(db, "NadeoServices", nadeoAuth);
    await Auth.Game.load();
  }

  if (!payload.userId) {
    return context.res.json({ message: "This action requires 'userId'.", code: 500 });
  }
  
  if (!payload.year) {
    return context.res.json({ message: "This action requires 'year'.", code: 500 });
  }

  let lastUpdate = null;

  try {
    const docRes = await db.getDocument<any>("default", "profiles", payload.userId);
    lastUpdate = docRes.lastUpdate;
  } catch (_err) {
    // If error occured, and not admin, exit
    const adminPass = Deno.env.get('ADMIN_PASS') as string;
    if (!payload.password || payload.password !== adminPass) {
      return context.res.json({ message: "Only administrator can add new players to leaderboard.", code: 500 });
    }
  }

  const adminPass = Deno.env.get('ADMIN_PASS') as string;

  if (lastUpdate) {
    const now = Date.now();

    const h1 = 1000 * 60 * 60;
    if (lastUpdate + h1 > now) {
      if (!payload.password || payload.password !== adminPass) {
        return context.res.json({ message: "You can only refresh profile once every hour.", code: 500 });
      }
    }
  }

  if (timeoutCache[appwriteUserId]) {
    if (!payload.password || payload.password !== adminPass) {
      return context.res.json({ message: "To prevent abuse, you can only use this button once every 60 seconds.", code: 500 });
    }
  }
  timeoutCache[appwriteUserId] = Date.now();
  setTimeout(() => {
    timeoutCache[appwriteUserId] = null;
  }, 60000);

  /*
  Deprecated: https://webservices.openplanet.dev/oauth/reference/accounts/id-to-name
  const accountRes = await (await getAxiod()).get("https://prod.trackmania.core.nadeo.online/accounts/displayNames/?accountIdList=" + payload.userId, {
    headers: {
      'User-Agent': 'tmstats.eu / 0.0.3 matejbaco2000@gmail.com',

      'Authorization': 'nadeo_v1 t=' + await Auth.Game.getToken(),
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });
   */

  const nickname = "Unknown";

  const allMedals = await Daily.getMedals(payload.userId, db, payload.year);

  let score = 0;
  let gold = 0;
  let author = 0;
  let silver = 0;
  let bronze = 0;

  for (const date in allMedals) {
    const medal = allMedals[date].medal;

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
      score += 12;
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
    nickname
  }

  try {
    const docRes = await db.getDocument("default", "profiles", payload.userId);
    const docId = docRes.$id;

    await db.updateDocument("default", "profiles", docId, newDocData);
  } catch (_err) {
    await db.createDocument("default", "profiles", payload.userId, newDocData);
  }

  return context.res.json({
    message: "Profile successfully updated!",
  });
};

export default async function (context: any) {
  try {
    return await func(context);
  } catch (err) {
    console.log(err);
    return context.res.json({
      message: err
    });
  }
}