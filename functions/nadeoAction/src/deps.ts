// deno-lint-ignore-file no-explicit-any

export * as sdk from "https://deno.land/x/appwrite@3.0.0/mod.ts";

// https://players.trackmania.com/server/dedicated

import { axiod as _axiod } from "https://deno.land/x/axiod/mod.ts";
export class RateLimiter {
    public static Limiter: any;

    bucket: number;

    constructor(private refill: number = 1, private interval: number = 1000) {
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

export const getAxiod = async () => {
    await RateLimiter.Limiter.take();
    return _axiod;
}
