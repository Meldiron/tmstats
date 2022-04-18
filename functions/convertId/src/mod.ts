import { axiod as _axiod } from "https://deno.land/x/axiod/mod.ts";
import { RateLimiter } from "https://esm.sh/limiter@2.1.0";

const limiter = new RateLimiter({ tokensPerInterval: 1, interval: "second" });

export const getAxiod = async () => {
  await limiter.removeTokens(1);
  return _axiod;
}

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

export default async function (req: any, res: any) {
  const payload = JSON.parse(req.payload || '{}');

  if (!payload.nick) {
    return res.json({ message: "This action requires 'nick'.", code: 500 });
  }

  const tmRes = await (await getAxiod()).get("https://trackmania.io/api/players/find?search=" + payload.nick, {
    headers: {
      'User-Agent': 'tm.matejbaco.eu / 0.0.1 matejbaco2000@gmail.com'
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