import { axiod as _axiod } from "https://deno.land/x/axiod/mod.ts";

class RateLimiter {
  bucket: number;

  constructor(private refill: number = 1, private interval: number = 1000) {
    this.bucket = refill;

    setInterval(() => {
      this.bucket = refill;
    }, interval);
  }

  public async take() {
    if (this.bucket > 0) {
      this.bucket--;
      return true;
    }

    await new Promise((res) => {
      const int = setInterval(() => {
        if (this.bucket > 0) {
          this.bucket--;
          clearInterval(int);
          res(true);
        }
      }, 50);
    })

    return true;
  }
}
const rateLimiter = new RateLimiter();

export const getAxiod = async () => {
  await rateLimiter.take();
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