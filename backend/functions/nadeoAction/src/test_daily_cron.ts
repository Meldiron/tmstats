// deno-lint-ignore-file no-explicit-any

import Func from "./mod_daily_cron.ts";

import { config } from "https://deno.land/x/dotenv/mod.ts";

const env = config();

await Func({
    variables: env,
    payload: '{}'
}, {
    json: (json: any, _code: any) => {
        console.log(json);
    },
    send: (msg: any, _code: any) => {
        console.log(msg);
    }
}).catch((err) => {
    console.log(err);
})