// deno-lint-ignore-file no-explicit-any

import { Auth } from './Auth.ts';
import { Daily } from './Daily.ts';
import { getAxiod, sdk, RateLimiter } from './deps.ts';

// https://players.trackmania.com/server/dedicated

RateLimiter.Limiter = new RateLimiter();

let timeoutCache: any = {};

setInterval(() => {
	timeoutCache = {};
}, 60000 * 5);

let client: sdk.Client = null as any;
let db: sdk.Databases = null as any;

const func = async function (context: any) {
	if (!Deno.env.get('NADE_AUTH')) {
		return context.res.json({ message: 'Missing environment variables', code: 500 });
  }

  context.log(context.req.bodyText);
  context.log('---');

	const payload = JSON.parse(context.req.bodyText || '{}');

  let appwriteUserId = context.req.headers['x-appwrite-user-id'] as string;

  context.log(payload);

	if (payload.adminPassword) {
		if (payload.adminPassword !== Deno.env.get('ADMIN_PASSWORD')) {
			return context.res.json({ message: 'Invalid admin password.', code: 403 });
		}

		if (!payload.userId) {
			return context.res.json({ message: "This action requires 'userId' when using admin password.", code: 500 });
		}

		appwriteUserId = payload.userId;
	}

	client = new sdk.Client();
	db = new sdk.Databases(client);

	client
		.setEndpoint(Deno.env.get('APPWRITE_FUNCTION_API_ENDPOINT') as string)
		.setProject(Deno.env.get('APPWRITE_FUNCTION_PROJECT_ID') as string)
		.setKey(context.req.headers['x-appwrite-key'] as string);

	const nadeoAuth = Deno.env.get('NADE_AUTH') as string;

	if (!Auth.Live) {
		Auth.Live = new Auth(db, 'NadeoLiveServices', nadeoAuth);
		await Auth.Live.load();
	}

	if (!Auth.Game) {
		Auth.Game = new Auth(db, 'NadeoServices', nadeoAuth);
		await Auth.Game.load();
	}

	let newMedals: any = {};
	let existingMedals: any = {};

	try {
		const docRes = await db.getDocument('default', 'profiles', appwriteUserId);
		existingMedals = JSON.parse(docRes.medals);
	} catch (_err) {
		// OK
	}

	const tmRes = await (
		await getAxiod()
	).get('https://trackmania.io/api/player/' + appwriteUserId, {
		headers: {
			'User-Agent': 'tmstats.almostapps.eu / 0.0.3 matejbaco2000@gmail.com'
		}
	});
	const nickname = tmRes?.data?.displayname ?? 'Unknown';

	const saveProgress = async (partialMedals: any) => {
		newMedals = { ...newMedals, ...partialMedals };

		const mergedMedals = { ...existingMedals, ...newMedals };

		let score = 0;
		let gold = 0;
		let author = 0;
		let silver = 0;
		let bronze = 0;

		for (const key in mergedMedals) {
			const medal = mergedMedals[key].medal;

			if (medal === 1) {
				bronze++;
				score += 1;
			} else if (medal === 2) {
				silver++;
				score += 2;
			} else if (medal === 3) {
				gold++;
				score += 4;
			} else if (medal === 4) {
				author++;
				score += 12;
			}
		}

		const newDocData = {
			medals: JSON.stringify(mergedMedals),
			score,
			gold,
			author,
			bronze,
			silver,
			nickname
		};

		try {
			const docRes = await db.getDocument('default', 'profiles', appwriteUserId);
			const docId = docRes.$id;

			await db.updateDocument('default', 'profiles', docId, newDocData);
		} catch (_err) {
			await db.createDocument('default', 'profiles', appwriteUserId, newDocData);
		}
	};

	if (payload.type === 'all') {
		newMedals = {};
		newMedals = { ...newMedals, ...(await Daily.getMedalsShorts(appwriteUserId, db, null, null, existingMedals, saveProgress)) };
		newMedals = { ...newMedals, ...(await Daily.getMedalsWeeklyGrand(appwriteUserId, db, null, null, existingMedals, saveProgress)) };
		newMedals = { ...newMedals, ...(await Daily.getMedalsCampaign(appwriteUserId, db, null, existingMedals, saveProgress)) };
		newMedals = { ...newMedals, ...(await Daily.getMedals(appwriteUserId, db, null, null, existingMedals, saveProgress)) };
	} else if (payload.type === 'cotd') {
		if (!payload.year) {
			return context.res.json({ message: "This action requires 'year'.", code: 500 });
		}

		if (!payload.month) {
			return context.res.json({ message: "This action requires 'month'.", code: 500 });
		}

		newMedals = await Daily.getMedals(appwriteUserId, db, payload.year, payload.month, existingMedals, saveProgress);
	} else if (payload.type === 'shorts') {
		if (!payload.year) {
			return context.res.json({ message: "This action requires 'year'.", code: 500 });
		}
		if (!payload.week) {
			return context.res.json({ message: "This action requires 'week'.", code: 500 });
		}

		newMedals = await Daily.getMedalsShorts(appwriteUserId, db, payload.year, payload.week, existingMedals, saveProgress);
	} else if (payload.type === 'grands') {
		if (!payload.year) {
			return context.res.json({ message: "This action requires 'year'.", code: 500 });
		}

		newMedals = await Daily.getMedalsWeeklyGrand(appwriteUserId, db, payload.year, payload.week ?? null, existingMedals, saveProgress);
	} else if (payload.type === 'campaign') {
		if (!payload.campaignUid) {
			return context.res.json({ message: "This action requires 'campaignUid'.", code: 500 });
		}

		newMedals = await Daily.getMedalsCampaign(appwriteUserId, db, payload.campaignUid, existingMedals, saveProgress);
	} else {
		return context.res.json({
			message: "This action requires 'type' and it must be one of 'cotd', 'shorts', 'grands', or 'campaign'.",
			code: 500
		});
	}

	await saveProgress({});

	return context.res.json({
		message: 'Profile successfully updated!'
	});
};

export default async function (context: any) {
	try {
		return await func(context);
	} catch (err) {
		console.log(err);
		return context.res.json({
			message: err
		});
	}
}
