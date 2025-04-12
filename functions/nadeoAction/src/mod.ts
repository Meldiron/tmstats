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

	const appwriteUserId = context.req.headers['x-appwrite-user-id'] as string;

	const payload = JSON.parse(context.req.bodyText || '{}');

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

	if (!payload.userId) {
		return context.res.json({ message: "This action requires 'userId'.", code: 500 });
	}

	let newMedals: any[];

	if (payload.type === 'cotd') {
		if (!payload.year) {
			return context.res.json({ message: "This action requires 'year'.", code: 500 });
		}

		if (!payload.month) {
			return context.res.json({ message: "This action requires 'month'.", code: 500 });
		}

		newMedals = await Daily.getMedals(payload.userId, db, payload.year, payload.month);
	} else if (payload.type === 'shorts') {
		if (!payload.year) {
			return context.res.json({ message: "This action requires 'year'.", code: 500 });
		}
		if (!payload.week) {
			return context.res.json({ message: "This action requires 'week'.", code: 500 });
		}

		newMedals = await Daily.getMedalsShorts(payload.userId, db, payload.year, payload.week);
	} else if (payload.type === 'campaign') {
		if (!payload.campaignUid) {
			return context.res.json({ message: "This action requires 'campaignUid'.", code: 500 });
		}

		newMedals = await Daily.getMedalsCampaign(payload.userId, db, payload.campaignUid);
	} else {
		return context.res.json({
			message: "This action requires 'type' and it must be one of 'cotd', 'shorts', or 'campaign'.",
			code: 500
		});
	}

	const tmRes = await (
		await getAxiod()
	).get('https://trackmania.io/api/player/' + payload.userId, {
		headers: {
			'User-Agent': 'tmstats.almostapps.eu / 0.0.3 matejbaco2000@gmail.com'
		}
	});
	const nickname = tmRes?.data?.displayname ?? 'Unknown';

	try {
		const docRes = await db.getDocument('default', 'profiles', payload.userId);
		const docMedals = JSON.parse(docRes.medals);
		for (const key of Object.keys(docMedals)) {
			if (!newMedals[key]) {
				newMedals[key] = docMedals[key];
			}
		}
	} catch (_err) {
		// OK
	}

	let score = 0;
	let gold = 0;
	let author = 0;
	let silver = 0;
	let bronze = 0;

	for (const key in newMedals) {
		const medal = newMedals[key].medal;

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
		medals: JSON.stringify(newMedals),
		score,
		gold,
		author,
		bronze,
		silver,
		nickname
	};

	try {
		const docRes = await db.getDocument('default', 'profiles', payload.userId);
		const docId = docRes.$id;

		await db.updateDocument('default', 'profiles', docId, newDocData);
	} catch (_err) {
		await db.createDocument('default', 'profiles', payload.userId, newDocData);
	}

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
