// deno-lint-ignore-file no-explicit-any

import axiod from "https://deno.land/x/axiod/mod.ts";
import { db } from "./mod.ts";
import { decode } from "https://deno.land/std@0.74.0/encoding/base64url.ts";

export class Auth {
    public static Game: Auth = null as any;
    public static Live: Auth = null as any;

    private accessToken: string | null = null;
    private refreshToken: string | null = null;

    constructor(private service: 'NadeoLiveServices' | 'NadeoServices', private nadeoAuth: string) {
    }

    async getToken() {
        if (this.accessToken === null || this.isExpired()) {
            await this.loginAction();
        }

        return this.accessToken;
    }

    async load() {
        let doc: any = null;

        try {
            const cacheRes = await db.getDocument("nadeoCache", "auth");
            doc = cacheRes;
        } catch (_err) {
            const cacheRes = await db.createDocument("nadeoCache", "auth", {
                value: '{}'
            });
            doc = cacheRes;
        }

        doc = JSON.parse(doc.value);

        if (doc[this.service]) {
            this.accessToken = doc[this.service].accessToken;
            this.refreshToken = doc[this.service].refreshToken;
            this.accessToken;
        }
    }

    private async save() {
        let doc: any = null;

        try {
            const cacheRes = await db.getDocument("nadeoCache", "auth");
            doc = cacheRes;
        } catch (_err) {
            const cacheRes = await db.createDocument("nadeoCache", "auth", {
                value: '{}'
            });
            doc = cacheRes;
        }

        doc = JSON.parse(doc.value);

        if (!doc[this.service]) {
            doc[this.service] = {};
        }

        doc[this.service]['accessToken'] = this.accessToken;
        doc[this.service]['refreshToken'] = this.refreshToken;

        await db.updateDocument("nadeoCache", "auth", {
            value: JSON.stringify(doc)
        });
    }

    private isExpired() {
        const access = this.accessToken ? JSON.parse(new TextDecoder().decode(new Uint8Array(decode((this.accessToken as string).split(".")[1])))) : null;

        if (access && access.rat - (Date.now() / 1000) < 0) {
            return true;
        }

        return false;
    }

    private async loginAction() {
        const refresh = this.refreshToken ? JSON.parse(new TextDecoder().decode(new Uint8Array(decode((this.refreshToken as string).split(".")[1])))) : null;
        if (refresh && refresh.exp - (Date.now() / 1000) < 0) {
            await this.refreshTokenAction();
        } else {
            await this.newTokenAction();
        }

        await this.save();
    }

    private async newTokenAction() {
        console.warn("Getting new tokens for " + this.service);
        const loginRes = await axiod.post("https://prod.trackmania.core.nadeo.online/v2/authentication/token/basic", {
            audience: this.service
        }, {
            headers: {
                'Authorization': 'Basic ' + this.nadeoAuth,
                'Content-Type': 'application/json',
            }
        });

        const auth = loginRes.data;

        this.accessToken = auth.accessToken;
        this.refreshToken = auth.refreshToken;
    }

    private async refreshTokenAction() {
        console.warn("Refreshing tokens for " + this.service);
        const refreshRes = await axiod.post("https://prod.trackmania.core.nadeo.online/v2/authentication/token/refresh", {}, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'nadeo_v1 t=' + this.refreshToken
            }
        });

        const auth = refreshRes.data;
        this.accessToken = auth.accessToken;
        this.refreshToken = auth.refreshToken;
    }
}