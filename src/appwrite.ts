import { Client, Storage, Databases, Query, Functions } from 'appwrite';
import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';

const client = new Client();

client.setEndpoint('https://cloud.appwrite.io/v1').setProject('tmStats');

const storage = new Storage(client);
const functions = new Functions(client);
const database = new Databases(client);

export const toastConfig = {
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
	static async getHeatmap(profileId: string) {
		try {
			const dbRes = await database.getDocument<any>('default', 'profiles', profileId);
			const dataSet = JSON.parse(dbRes.medals);
			return {
				...dbRes,
				medals: dataSet
			};
		} catch (err) {
			console.error(err);

			Toastify({
				...toastConfig,
				text: 'Could not load profile: ' + err.message
			}).showToast();
		}
	}

	static async getMapsDetails(year: number) {
		try {
			const allDocuments = [];
			let cursor: string | undefined = undefined;
			do {
				try {
					const queries = [Query.equal('year', year), Query.limit(100)];

					if (cursor) {
						queries.push(Query.cursorAfter(cursor));
					}

					const dbRes = await database.listDocuments<any>('default', 'dailyMaps', queries);

					if (dbRes.documents.length <= 0) {
						cursor = '-1';
						break;
					}

					allDocuments.push(...dbRes.documents);
					cursor = dbRes.documents[dbRes.documents.length - 1].$id;
				} catch (err) {
					console.error(err);
					cursor = '-1';
				}
			} while (cursor !== '-1');

			return allDocuments;
		} catch (err) {
			console.error(err);

			Toastify({
				...toastConfig,
				text: 'Could not load map info: ' + err.message
			}).showToast();
		}
	}

	static async listProfiles(orerByAttr: string, limit = 100, offset = 0) {
		try {
			const docs = await database.listDocuments('default', 'profiles', [
				Query.limit(limit),
				Query.offset(offset),
				Query.orderDesc(orerByAttr === 'points' ? 'score' : orerByAttr)
			]);

			return docs.documents;
		} catch (err) {
			console.error(err);

			Toastify({
				...toastConfig,
				text: 'Could not load leaderboard: ' + err.message
			}).showToast();
		}

		return [];
	}

	static async nadeoAction(profileId: string, year: number, month: number): Promise<string> {
		try {
			const execInterval = setInterval(() => {
				Toastify({
					...toastConfig,
					style: {
						background: '#3b82f6'
					},
					duration: 3000,
					stopOnFocus: false,
					text: 'Your profile update is still being processed ...'
				}).showToast();
			}, 5000);

			const res = await functions.createExecution(
				'nadeoAction',
				JSON.stringify({
					userId: profileId,
					year: year,
					month: month
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
					background: '#14b583'
				}
			}).showToast();

			return json.message;
		} catch (err) {
			let msg = 'Could not update profile: ' + err.message;
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
