// deno-lint-ignore-file no-explicit-any

import { Auth } from "./Auth.ts";
import { Daily } from "./Daily.ts";
import { sdk, RateLimiter } from "./deps.ts";

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

RateLimiter.Limiter = new RateLimiter(1, 5000);

let client: sdk.Client = null as any;
let db: sdk.Database = null as any;
let storage: sdk.Storage = null as any;

const func = async function (req: any, res: any) {
  if (
    !req.env['APPWRITE_FUNCTION_ENDPOINT'] ||
    !req.env['APPWRITE_FUNCTION_PROJECT_ID'] ||
    !req.env['APPWRITE_FUNCTION_API_KEY'] ||
    !req.env['NADE_AUTH']
  ) {
    return res.json({ message: "Missing environment variables", code: 500 });
  }

  client = new sdk.Client();
  db = new sdk.Database(client);
  storage = new sdk.Storage(client);

  client
    .setEndpoint(req.env['APPWRITE_FUNCTION_ENDPOINT'] as string)
    .setProject(req.env['APPWRITE_FUNCTION_PROJECT_ID'] as string)
    .setKey(req.env['APPWRITE_FUNCTION_API_KEY'] as string);

  const nadeoAuth = req.env['NADE_AUTH'] as string;

  if (!Auth.Live) {
    Auth.Live = new Auth(db, "NadeoLiveServices", nadeoAuth);
    await Auth.Live.load();
  }

  if (!Auth.Game) {
    Auth.Game = new Auth(db, "NadeoServices", nadeoAuth);
    await Auth.Game.load();
  }

  const missingMaps = await Daily.fetchMissingMaps(db, storage);

  for (const map of missingMaps) {
    try {
      await db.getDocument('dailyMaps', map.key);
      await db.updateDocument('dailyMaps', map.key, map);
    } catch (_err) {
      await db.createDocument('dailyMaps', map.key, map);
    }
  }

  return res.json({
    message: "Map information updated! Dowloaded " + missingMaps.length + " maps: " + missingMaps.map((m: any) => m.key).join(","),
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
    throw err;
  }
}