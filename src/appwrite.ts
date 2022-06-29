import { Client, Storage, Databases, Query, Account, Functions } from 'appwrite';
import Toastify from 'toastify-js'
import "toastify-js/src/toastify.css"

const client = new Client();

client.setEndpoint('https://appwrite.tmstats.eu/v1').setProject('trackmaniaDailyStats');

const storage = new Storage(client);
const account = new Account(client);
const functions = new Functions(client);
const database = new Databases(client, "default");

export const toastConfig = {
    duration: 5000,
    close: true,
    gravity: "top",
    position: "center",
    stopOnFocus: true,
    style: {
        background: "#ef4444",
    },
    // onClick: function(){}
};
export class AppwriteService {
    static getImg(id: string) {
        return storage.getFilePreview("mapImages2", id, 640)
    }

    static async ensureAuth(): Promise<void> {
        try {
            await account.get();
        } catch (err0) {
            try {
                await account.createAnonymousSession();
            } catch (err) {
                console.error(err0);
                console.error(err);

                Toastify({
                    ...toastConfig,
                    text: "Account count not be created, website might not work properly: " + err,
                }).showToast();
            }
        }
    }

    static async getHeatmap(profileId: string) {
        try {
            await this.ensureAuth();

            const dbRes = await database.getDocument<any>('profiles', profileId);
            const dataSet = JSON.parse(dbRes.medals);
            return {
                ...dbRes,
                medals: dataSet
            };
        } catch (err) {
            console.error(err);

            Toastify({
                ...toastConfig,
                text: "Could not load profile: " + err.message,
            }).showToast();
        }
    }

    static async getMapsDetails(year: number) {
        try {
            await this.ensureAuth();

            const allDocuments = [];
            let cursor: string | undefined = undefined;
            do {
                try {
                    const dbRes = await database.listDocuments<any>('dailyMaps', [
                        Query.equal("year", year)
                    ], 100, undefined, cursor);

                    if (dbRes.documents.length <= 0) {
                        cursor = "-1";
                        break;
                    }

                    allDocuments.push(...dbRes.documents);
                    cursor = dbRes.documents[dbRes.documents.length - 1].$id;

                } catch (err) {
                    console.error(err);
                    cursor = "-1"
                }
            } while (cursor !== "-1");

            return allDocuments;
        } catch (err) {
            console.error(err);

            Toastify({
                ...toastConfig,
                text: "Could not load map info: " + err.message,
            }).showToast();
        }
    }

    static async listProfiles(orerByAttr: string, limit = 100, offset = 0) {
        try {
            await this.ensureAuth();


            const docs = await database.listDocuments(
                'profiles',
                [],
                limit,
                offset,
                undefined,
                undefined,
                [orerByAttr === 'points' ? 'score' : orerByAttr],
                ['DESC']
            );

            return docs.documents;
        } catch (err) {
            console.error(err);

            Toastify({
                ...toastConfig,
                text: "Could not load leaderboard: " + err.message,
            }).showToast();
        }

        return [];
    }

    static async nadeoAction(profileId: string): Promise<string> {
        try {
            const execInterval = setInterval(() => {
                Toastify({
                    ...toastConfig,
                    style: {
                        background: "#3b82f6"
                    },
                    duration: 3000,
                    stopOnFocus: false,
                    text: "Your profile update is still being processed ...",
                }).showToast();
            }, 5000);

            await this.ensureAuth();

            const res = await functions.createExecution(
                'nadeoAction',
                JSON.stringify({
                    userId: profileId
                }),
                false
            );

            if (execInterval) {
                clearInterval(execInterval);
            }

            if (res.stderr) {
                throw new Error(res.stderr);
            }

            const json = JSON.parse(res.response);
            Toastify({
                ...toastConfig,
                text: json.message,
                style: {
                    background: "#14b583"
                }
            }).showToast();

            return json.message;
        } catch (err) {
            let msg = "Could not update profile: " + err.message;
            if (err.message) {
                msg = err.message;
            }

            Toastify({
                ...toastConfig,
                text: msg
            }).showToast();
        }

        return null;
    }

    static async getId(nick: string): Promise<string> {
        try {
            await this.ensureAuth();

            const res = await functions.createExecution(
                'convertId',
                JSON.stringify({
                    nick
                }),
                false
            );

            if (res.stderr) {
                throw new Error(res.stderr);
            }

            const id: string = JSON.parse(res.response).id;
            return id;

        } catch (err) {
            let msg = "Could not get user's ID: " + err.message;
            if (err.message) {
                msg = err.message;
            }

            Toastify({
                ...toastConfig,
                text: msg
            }).showToast();
        }

        return null;
    }
}