export * as sdk from "https://deno.land/x/appwrite@3.0.0/mod.ts";

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
