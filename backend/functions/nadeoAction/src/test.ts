// deno-lint-ignore-file no-explicit-any

import Func from "./mod.ts";

import { config } from "https://deno.land/x/dotenv/mod.ts";

const env = config();

await Func({
    env,
    payload: '{"userId":"5ca1fa3a-3413-4863-86d7-7a47982abc1b","password":"dev"}'
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