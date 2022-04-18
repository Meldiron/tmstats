import { Appwrite } from 'appwrite';

const appwrite = new Appwrite();

appwrite.setEndpoint('https://appwrite.tmstats.eu/v1').setProject('trackmaniaDailyStats');

export class AppwriteService {
    static async ensureAuth(): Promise<void> {
        try {
            await appwrite.account.get();
        } catch (err) {
            await appwrite.account.createAnonymousSession();
        }
    }

    static async getHeatmap(profileId: string) {
        await this.ensureAuth();

        const dbRes = await appwrite.database.getDocument<any>('profiles', profileId);
        const dataSet = JSON.parse(dbRes.medals);
        return {
            ...dbRes,
            medals: dataSet
        };
    }


    static async listProfiles(orerByAttr: string) {
        await this.ensureAuth();


        const docs = await appwrite.database.listDocuments(
            'profiles',
            [],
            100,
            undefined,
            undefined,
            undefined,
            [orerByAttr === 'points' ? 'score' : orerByAttr],
            ['DESC']
        );

        return docs.documents;
    }

    static async nadeoAction(profileId: string): Promise<string> {
        await this.ensureAuth();

        const res = await appwrite.functions.createExecution(
            'nadeoAction',
            JSON.stringify({
                userId: profileId
            }),
            false
        );


        if (res.stderr) {
            throw new Error(res.stderr);
        }

        return res.stdout;
    }

    static async getId(nick: string): Promise<string> {
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
    }
}

AppwriteService.ensureAuth();