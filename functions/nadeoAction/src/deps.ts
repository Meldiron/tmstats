export * as sdk from "https://deno.land/x/appwrite@3.0.0/mod.ts";

import axiod from "https://deno.land/x/axiod/mod.ts";
import { RateLimiter } from "https://esm.sh/limiter@2.1.0";

const limiter = new RateLimiter({ tokensPerInterval: 1, interval: "second" });

export const getAxiod = async () => {
    await limiter.removeTokens(1);
    return axiod;
}
