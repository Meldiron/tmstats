import { Client, Databases, Query, Functions, type Models, Account } from 'appwrite';
import {
	Client as ServerClient,
	Databases as ServerDatabases,
	Users as ServerUsers
} from 'node-appwrite';
import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';

export type AppwriteMap = {
	mapid: string;
	mapUid: string;
	silverScore: number;
	bronzeScore: number;
	goldScore: number;
	authorScore: number;
	thumbnailUrl: string; // URL
	collectionName: string;
	name: string;
	key: string;
} & Models.Document;

export type AppwriteProfile = {
	silver: number;
	bronze: number;
	gold: number;
	author: number;
	nickname: string;
	score: number;
	medals: string; // Convert to JSON
} & Models.Document;

export type AppwriteWeeklyMaps = {
	week: number;
	year: number;
	position: number;
} & AppwriteMap;

export type AppwriteDailyMaps = {
	day: number;
	month: number;
	year: number;
} & AppwriteMap;

export type AppwriteCampaignMap = {
	position: number;
	campaignUid: string;
} & AppwriteMap;

const client = new Client();
client.setEndpoint('https://cloud.appwrite.io/v1').setProject('tmStats');

const functions = new Functions(client);
const account = new Account(client);
const database = new Databases(client);

export const toastConfig: Toastify.Options = {
	duration: 5000,
	close: true,
	gravity: 'top',
	position: 'center',
	stopOnFocus: true,
	style: {
		background: '#ef4444'
	}
	// onClick: function(){}
};
export class AppwriteService {
	static async getAccount() {
		try {
			return await account.get();
		} catch {
			return null;
		}
	}

	static async signOut() {
		await account.deleteSession('current');
	}

	static async createSession(userId: string, secret: string) {
		await account.createSession(userId, secret);
	}

	static async serverSetupProfile(apiKey: string, id: string, nickname: string) {
		const client = new ServerClient();
		client.setEndpoint('https://cloud.appwrite.io/v1').setProject('tmStats').setKey(apiKey);
		const database = new ServerDatabases(client);

		try {
			await database.getDocument<AppwriteProfile>('default', 'profiles', id);
		} catch {
			await database.createDocument('default', 'profiles', id, {
				medals: JSON.stringify({}),
				score: 0,
				gold: 0,
				author: 0,
				bronze: 0,
				silver: 0,
				nickname
			});
		}
	}

	static async serverStoreCredentials(
		apiKey: string,
		userId: string,
		accessToken: string,
		refreshToken: string,
		expiresAt: number
	) {
		const client = new ServerClient();
		client.setEndpoint('https://cloud.appwrite.io/v1').setProject('tmStats').setKey(apiKey);
		const database = new ServerDatabases(client);

		try {
			await database.createDocument('default', 'oauthTokens', userId, {
				accessToken,
				refreshToken,
				expiresAt
			});
		} catch {
			await database.updateDocument('default', 'oauthTokens', userId, {
				accessToken,
				refreshToken,
				expiresAt
			});
		}
	}

	static async serverCreateSession(apiKey: string, userId: string, name: string) {
		const client = new ServerClient();
		client.setEndpoint('https://cloud.appwrite.io/v1').setProject('tmStats').setKey(apiKey);
		const users = new ServerUsers(client);

		try {
			await users.get(userId);
		} catch {
			await users.create(userId);
		}

		await users.updateName(userId, name);

		const token = await users.createToken(userId);

		return token;
	}

	static async getProfile(id: string) {
		try {
			const dbRes = await database.getDocument<AppwriteProfile>('default', 'profiles', id);
			const dataSet = JSON.parse(dbRes.medals);
			return {
				...dbRes,
				medals: dataSet
			};
		} catch (err: unknown) {
			console.error(err);

			const msg = err instanceof Error ? err.message : 'An unknown error occurred';

			Toastify({
				...toastConfig,
				text: 'Could not load profile: ' + msg
			}).showToast();
		}
	}

	static async getCampaignMaps() {
		try {
			const maps = [];
			let cursor: null | string = null;

			do {
				const queries = [Query.limit(500), Query.orderDesc('$createdAt')];

				if (cursor) {
					queries.push(Query.cursorAfter(cursor));
				}

				const dbRes = await database.listDocuments<AppwriteCampaignMap>(
					'default',
					'campaignMaps',
					queries
				);

				maps.push(...dbRes.documents);

				if (dbRes.documents.length > 0) {
					cursor = dbRes.documents[dbRes.documents.length - 1].$id;
				} else {
					cursor = null;
				}
			} while (cursor !== null);

			return maps;
		} catch (err: unknown) {
			console.error(err);

			const msg = err instanceof Error ? err.message : 'An unknown error occurred';

			Toastify({
				...toastConfig,
				text: 'Could not load campaigns: ' + msg
			}).showToast();

			return [];
		}
	}

	static async getWeeklyMaps() {
		try {
			const maps = [];
			let cursor: null | string = null;

			do {
				const queries = [Query.limit(500), Query.orderDesc('$createdAt')];

				if (cursor) {
					queries.push(Query.cursorAfter(cursor));
				}

				const dbRes = await database.listDocuments<AppwriteWeeklyMaps>(
					'default',
					'weeklyMaps',
					queries
				);

				maps.push(...dbRes.documents);

				if (dbRes.documents.length > 0) {
					cursor = dbRes.documents[dbRes.documents.length - 1].$id;
				} else {
					cursor = null;
				}
			} while (cursor !== null);

			return maps;
		} catch (err: unknown) {
			console.error(err);

			const msg = err instanceof Error ? err.message : 'An unknown error occurred';

			Toastify({
				...toastConfig,
				text: 'Could not load weekly shorts: ' + msg
			}).showToast();

			return [];
		}
	}

	static async getDailyMaps() {
		try {
			const maps = [];
			let cursor: null | string = null;

			do {
				const queries = [Query.limit(500), Query.orderDesc('$createdAt')];

				if (cursor) {
					queries.push(Query.cursorAfter(cursor));
				}

				const dbRes = await database.listDocuments<AppwriteDailyMaps>(
					'default',
					'dailyMaps',
					queries
				);

				maps.push(...dbRes.documents);

				if (dbRes.documents.length > 0) {
					cursor = dbRes.documents[dbRes.documents.length - 1].$id;
				} else {
					cursor = null;
				}
			} while (cursor !== null);

			return maps;
		} catch (err: unknown) {
			console.error(err);

			const msg = err instanceof Error ? err.message : 'An unknown error occurred';

			Toastify({
				...toastConfig,
				text: 'Could not load cup of the day maps: ' + msg
			}).showToast();

			return [];
		}
	}

	static async listProfiles(limit = 25, cursor: string | null = null) {
		try {
			const queries = [Query.limit(limit), Query.orderDesc('score')];

			if (cursor) {
				queries.push(Query.cursorAfter(cursor));
			}

			const docs = await database.listDocuments<AppwriteProfile>('default', 'profiles', queries);

			return docs.documents;
		} catch (err: unknown) {
			console.error(err);

			const msg = err instanceof Error ? err.message : 'An unknown error occurred';

			Toastify({
				...toastConfig,
				text: 'Could not load leaderboard: ' + msg
			}).showToast();
		}

		return [];
	}

	static async nadeoActionAll(): Promise<boolean> {
		try {
			const execInterval = setInterval(() => {
				Toastify({
					...toastConfig,
					style: {
						background: '#3b82f6'
					},
					duration: 2800,
					stopOnFocus: false,
					text: 'Your profile update is still being processed ...'
				}).showToast();
			}, 3000);

			let res = await functions.createExecution(
				'nadeoAction',
				JSON.stringify({
					type: 'all'
				}),
				true
			);

			do {
				res = await functions.getExecution('nadeoAction', res.$id);

				await new Promise((res) => setTimeout(() => res(true), 1000));
			} while (res.status === 'processing' || res.status === 'pending');

			if (execInterval) {
				clearInterval(execInterval);
			}

			if (res.responseStatusCode >= 400) {
				throw new Error('An internal error occured.');
			}

			Toastify({
				...toastConfig,
				text: 'Medals successfully updated.',
				style: {
					background: '#14b583'
				}
			}).showToast();

			return true;
		} catch (err: unknown) {
			let msg = err instanceof Error ? err.message : 'An unknown error occurred';

			msg = 'Could not update profile: ' + msg;

			Toastify({
				...toastConfig,
				text: msg
			}).showToast();
		}

		return false;
	}

	static async nadeoAction(
		type: string,
		year?: number,
		month?: number,
		week?: number,
		campaignUid?: string
	): Promise<boolean> {
		try {
			const execInterval = setInterval(() => {
				Toastify({
					...toastConfig,
					style: {
						background: '#3b82f6'
					},
					duration: 2800,
					stopOnFocus: false,
					text: 'Your profile update is still being processed ...'
				}).showToast();
			}, 3000);

			const res = await functions.createExecution(
				'nadeoAction',
				JSON.stringify({
					year,
					week,
					month,
					type,
					campaignUid
				}),
				false
			);

			if (execInterval) {
				clearInterval(execInterval);
			}

			if (res.responseStatusCode >= 400) {
				try {
					const json = JSON.parse(res.responseBody);
					throw new Error(json.message);
				} catch {
					throw new Error(res.responseBody);
				}
			}

			const json = JSON.parse(res.responseBody);

			if (json.code >= 400) {
				throw new Error(json.message);
			}

			Toastify({
				...toastConfig,
				text: json.message,
				style: {
					background: '#14b583'
				}
			}).showToast();

			return true;
		} catch (err: unknown) {
			let msg = err instanceof Error ? err.message : 'An unknown error occurred';

			msg = 'Could not update profile: ' + msg;

			Toastify({
				...toastConfig,
				text: msg
			}).showToast();
		}

		return false;
	}

	static async getId(nick: string): Promise<string> {
		try {
			const res = await functions.createExecution(
				'convertId',
				JSON.stringify({
					nick
				}),
				false
			);

			if (res.responseStatusCode >= 400) {
				try {
					const json = JSON.parse(res.responseBody);
					throw new Error(json.message);
				} catch {
					throw new Error(res.responseBody);
				}
			}

			const bodyJson = JSON.parse(res.responseBody);

			if (bodyJson.code >= 400) {
				throw new Error(bodyJson.message);
			}

			const id: string = bodyJson.id;
			return id;
		} catch (err: unknown) {
			let msg = err instanceof Error ? err.message : 'An unknown error occurred';
			msg = "Could not get user's ID: " + msg;
			Toastify({
				...toastConfig,
				text: msg
			}).showToast();
		}

		return '';
	}
}
