// deno-lint-ignore-file no-explicit-any

import { Auth } from "./Auth.ts";
import { Daily } from "./Daily.ts";
import { sdk, RateLimiter } from "./deps.ts";

RateLimiter.Limiter = new RateLimiter(1, 2000);

let client: sdk.Client = null as any;
let db: sdk.Databases = null as any;

const func = async function (context: any) {
  if (
    !Deno.env.get('NADE_AUTH')
  ) {
    return context.res.json({ message: "Missing environment variables", code: 500 });
  }

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

  const ids = await Daily.fetchMissingMaps(db);

  return context.res.json({
    message: "Map information updated! Dowloaded " + ids.length + " maps: " + ids
  });
};

export default async function (context: any) {
  try {
    return await func(context);
  } catch (err) {
    return context.res.json({
      message: err
    });
  }
}