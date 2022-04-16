// deno-lint-ignore-file no-explicit-any

import Func from "./mod.ts";

import { config } from "https://deno.land/x/dotenv/mod.ts";

const env = config();

await Func({
    env,
    payload: '{"type":"updateProfile","userId":"06e99ad3-cded-4440-a19c-b3df4fda8004"}'
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