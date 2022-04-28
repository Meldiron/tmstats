import { Appwrite, Query } from 'appwrite';
import Toastify from 'toastify-js'
import "toastify-js/src/toastify.css"

const appwrite = new Appwrite();

appwrite.setEndpoint('https://appwrite.tmstats.eu/v1').setProject('trackmaniaDailyStats');

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
    static async ensureAuth(): Promise<void> {
        try {
            await appwrite.account.get();
        } catch (err0) {
            try {
                await appwrite.account.createAnonymousSession();
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

            const dbRes = await appwrite.database.getDocument<any>('profiles', profileId);
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

    static async getMapsDetails(mapsId: string[]) {
        try {
            await this.ensureAuth();

            const allDocuments = [];

            const chunkSize = 100;
            for (let i = 0; i < mapsId.length; i += chunkSize) {
                const chunk = mapsId.slice(i, i + chunkSize);

                const dbRes = await appwrite.database.listDocuments<any>('dailyMaps', [
                    Query.equal("$id", chunk)
                ], 100);

                allDocuments.push(...dbRes.documents);
            }

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


            const docs = await appwrite.database.listDocuments(
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

            const res = await appwrite.functions.createExecution(
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

            const json = JSON.parse(res.stdout);
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

            const res = await appwrite.functions.createExecution(
                'convertId',
                JSON.stringify({
                    nick
                }),
                false
            );

            if (res.stderr) {
                throw new Error(res.stderr);
            }

            const id: string = JSON.parse(res.stdout).id;
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