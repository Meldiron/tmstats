// deno-lint-ignore-file no-explicit-any

import { Auth } from "./Auth.ts";
import { Daily } from "./Daily.ts";
import { getAxiod, sdk, RateLimiter } from "./deps.ts";

// https://players.trackmania.com/server/dedicated

/*
  'req' variable has:
    'headers' - object with request headers
    'payload' - object with request body data
    'variables' - object with function variables

  'res' variable has:
    'send(text, status)' - function to return text response. Status code defaults to 200
    'json(obj, status)' - function to return JSON response. Status code defaults to 200
  
  If an error is thrown, a response with code 500 will be returned.
*/

RateLimiter.Limiter = new RateLimiter();

let timeoutCache: any = {};

setInterval(() => {
  timeoutCache = {};
}, 60000 * 5);

let client: sdk.Client = null as any;
let db: sdk.Databases = null as any;

const func = async function (req: any, res: any) {
  if (
    !req.variables['APPWRITE_FUNCTION_ENDPOINT'] ||
    !req.variables['APPWRITE_FUNCTION_PROJECT_ID'] ||
    !req.variables['APPWRITE_FUNCTION_API_KEY'] ||
    !req.variables['NADE_AUTH'] ||
    !req.variables['ADMIN_PASS']
  ) {
    return res.json({ message: "Missing environment variables", code: 500 });
  }

  const appwriteUserId = req.variables['APPWRITE_FUNCTION_USER_ID'] as string;

  const payload = JSON.parse(req.payload || '{}');

  client = new sdk.Client();
  db = new sdk.Databases(client);

  client
    .setEndpoint(req.variables['APPWRITE_FUNCTION_ENDPOINT'] as string)
    .setProject(req.variables['APPWRITE_FUNCTION_PROJECT_ID'] as string)
    .setKey(req.variables['APPWRITE_FUNCTION_API_KEY'] as string);

  const nadeoAuth = req.variables['NADE_AUTH'] as string;

  if (!Auth.Live) {
    Auth.Live = new Auth(db, "NadeoLiveServices", nadeoAuth);
    await Auth.Live.load();
  }

  if (!Auth.Game) {
    Auth.Game = new Auth(db, "NadeoServices", nadeoAuth);
    await Auth.Game.load();
  }

  if (!payload.userId) {
    return res.json({ message: "This action requires 'userId'.", code: 500 });
  }

  let lastUpdate = null;

  try {
    const docRes = await db.getDocument<any>("default", "profiles", payload.userId);
    lastUpdate = docRes.lastUpdate;
  } catch (_err) {
    // If error occured, and not admin, exit
    const adminPass = req.variables['ADMIN_PASS'] as string;
    if (!payload.password || payload.password !== adminPass) {
      // return res.json({ message: "Only administrator can add new players to leaderboard.", code: 500 });
    }
  }

  const adminPass = req.variables['ADMIN_PASS'] as string;

  if (lastUpdate) {
    const now = Date.now();

    const h1 = 1000 * 60 * 60;
    if (lastUpdate + h1 > now) {
      if (!payload.password || payload.password !== adminPass) {
        return res.json({ message: "You can only refresh profile once every hour.", code: 500 });
      }
    }
  }

  if (timeoutCache[appwriteUserId]) {
    if (!payload.password || payload.password !== adminPass) {
      return res.json({ message: "To prevent abuse, you can only use this button once every 60 seconds.", code: 500 });
    }
  }
  timeoutCache[appwriteUserId] = Date.now();
  setTimeout(() => {
    timeoutCache[appwriteUserId] = null;
  }, 60000);

  const accountRes = await (await getAxiod()).get("https://prod.trackmania.core.nadeo.online/accounts/displayNames/?accountIdList=" + payload.userId, {
    headers: {
      'User-Agent': 'tmstats.eu / 0.0.2 matejbaco2000@gmail.com',

      'Authorization': 'nadeo_v1 t=' + await Auth.Game.getToken(),
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });

  const nickname = accountRes.data[0].displayName;

  const allMedals = await Daily.getMedals(payload.userId, db);

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

  return res.json({
    message: "Profile successfully updated!",
  });
};

export default async function (req: any, res: any) {
  try {
    await func(req, res);
  } catch (err) {
    console.log(err);

    if (!err.message) {
      err.message = "Unexpected error.";
    }

    res.json({
      message: err.message
    });
  }
}