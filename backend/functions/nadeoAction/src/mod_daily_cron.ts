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

RateLimiter.Limiter = new RateLimiter(1, 2000);

let client: sdk.Client = null as any;
let db: sdk.Databases = null as any;

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
  db = new sdk.Databases(client);

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

  /*
  // SCRIPT TO REMOVE ALL THUMBNAILS. NOT NEEDED ANYMORE
  const allDocs = [];
  let cursor: any = undefined;
  do {
    const docs = await db.listDocuments("default", "dailyMaps", [ sdk.Query.limit(100), sdk.Query.cursorAfter(cursor) ]);
    allDocs.push(...docs.documents);
    cursor = docs.documents[docs.documents.length - 1]?.$id;
  } while (cursor);

  for (const doc of allDocs) {
    await db.updateDocument("default", "dailyMaps", doc.$id, {
      ...doc,
      thumbnailFileId: ''
    })
  }
  */

  const ids = await Daily.fetchMissingMaps(db);

  return res.json({
    message: "Map information updated! Dowloaded " + ids.length + " maps: " + ids
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