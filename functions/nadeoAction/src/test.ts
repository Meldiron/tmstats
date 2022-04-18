// deno-lint-ignore-file no-explicit-any

import Func from "./mod.ts";
import { Daily } from "./Daily.ts";

import { config } from "https://deno.land/x/dotenv/mod.ts";

const env = config();

await Func({
    env,
    payload: '{"userId":"f6fe29aa-45dc-4fe9-9a95-d5e2c39f6b5f","password":"dev"}'
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