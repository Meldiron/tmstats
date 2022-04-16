// deno-lint-ignore-file no-explicit-any

import * as sdk from "https://deno.land/x/appwrite@3.0.0/mod.ts";
import { Auth } from "./Auth.ts";
import { Daily } from "./Daily.ts";

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
    !req.env['NADE_AUTH']
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

    return res.json({ message: "This action is not supported yet.", code: 500 });
  }

  if (payload.type === 'updateProfile') {

    if (!payload.userId) {
      return res.json({ message: "This action requires 'userId'.", code: 500 });
    }

    let lastUpdate = null;

    try {
      const docRes = await db.getDocument("profiles", payload.userId);
      lastUpdate = docRes.lastUpdate;
    } catch (_err) { }

    if (lastUpdate) {
      const now = Date.now();

      const h1 = 1000 * 60 * 60;
      if (lastUpdate + h1 > now) {
        return res.json({ message: "You can only refresh profile once every hour.", code: 500 });
      }
    }

    let allMedals: any = {};
    const currentMonth = new Date().getMonth() + 1;
    for (let month = currentMonth; month > 0; month--) {
      const monthMedals = await Daily.getMedals(payload.userId, month);
      allMedals = Object.assign({}, allMedals, monthMedals);
    }

    try {
      const docRes = await db.getDocument("profiles", payload.userId);
      const docId = docRes.$id;

      await db.updateDocument("profiles", docId, {
        lastUpdate: Date.now(),
        medals: JSON.stringify(allMedals)
      });
    } catch (_err) {
      await db.createDocument("profiles", payload.userId, {
        lastUpdate: Date.now(),
        medals: JSON.stringify(allMedals)
      });
    }
  }

  res.json({
    message: "Profile successfully updated!",
  });
};

export default func;