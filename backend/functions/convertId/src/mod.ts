import { axiod as _axiod } from "https://deno.land/x/axiod/mod.ts";

class RateLimiter {
  bucket: number;

  constructor(private refill: number = 2, private interval: number = 1000) {
    this.bucket = this.refill;

    setInterval(() => {
      this.bucket = this.refill;
    }, this.interval);
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

export default async function (context: any) {
  const payload = JSON.parse(context.req.bodyText || '{}');

  if (!payload.nick) {
    return context.res.json({ message: "This action requires 'nick'.", code: 500 });
  }

  const tmRes = await (await getAxiod()).get("https://trackmania.io/api/players/find?search=" + payload.nick, {
    headers: {
      'User-Agent': 'tmstats.eu / 0.0.3 matejbaco2000@gmail.com'
    }
  });
  const bodyJson = tmRes.data;

  if (bodyJson.length <= 0) {
    return context.res.json({ message: "User with this nickname not found.", code: 500 });
  }

  const userId = bodyJson[0].player.id;

  return context.res.json({
    id: userId
  });
}