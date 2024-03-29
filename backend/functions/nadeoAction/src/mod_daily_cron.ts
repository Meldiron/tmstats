// deno-lint-ignore-file no-explicit-any

import { Auth } from "./Auth.ts";
import { Daily } from "./Daily.ts";
import { sdk, RateLimiter } from "./deps.ts";

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

RateLimiter.Limiter = new RateLimiter(1, 2000);

let client: sdk.Client = null as any;
let db: sdk.Databases = null as any;

const func = async function (req: any, res: any) {
  if (
    !req.variables['APPWRITE_FUNCTION_ENDPOINT'] ||
    !req.variables['APPWRITE_FUNCTION_PROJECT_ID'] ||
    !req.variables['APPWRITE_FUNCTION_API_KEY'] ||
    !req.variables['NADE_AUTH']
  ) {
    return res.json({ message: "Missing environment variables", code: 500 });
  }

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

  const ids = await Daily.fetchMissingMaps(db);

  return res.json({
    message: "Map information updated! Dowloaded " + ids.length + " maps: " + ids
  });
};

export default async function (req: any, res: any) {
  try {
    await func(req, res);
  } catch (err) {
    res.json({
      message: err
    });
  }
}