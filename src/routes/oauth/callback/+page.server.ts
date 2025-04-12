import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

import { APPWRITE_API_KEY, TRACKMANIA_OAUTH_SECRET } from '$env/static/private';
import { AppwriteService } from '$lib/appwrite';

export const load: PageServerLoad = async ({ url }) => {
	const clientId = '5529e929151b2476f3c6';
	const clientSecret = TRACKMANIA_OAUTH_SECRET;

	const redirectUrl = url.origin + '/oauth/callback';

	const urlParams = new URLSearchParams(url.search);
	const code = urlParams.get('code');
	const pathEncoded = urlParams.get('state');
	const path = decodeURIComponent(pathEncoded ?? '');

	if (!code) {
		redirect(301, '/oauth/redirect?path=' + pathEncoded);
	}

	const response = await fetch('https://api.trackmania.com/api/access_token', {
		method: 'POST',
		headers: {
			'User-Agent': 'tmstats.almostapps.eu / 0.0.3 matejbaco2000@gmail.com',
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: `grant_type=authorization_code&code=${code}&client_secret=${clientSecret}&client_id=${clientId}&redirect_uri=${redirectUrl}`
	});
	const json = await response.json();

	if (json.message) {
		error(400, {
			message: json.message
		});
	}

	const expireIn = json.expires_in - 60; // in seconds
	const expireAt = Date.now() + expireIn * 1000;

	const accessToken = json.access_token;
	const refreshToken = json.refresh_token;

	const profileResponse = await fetch('https://api.trackmania.com/api/user', {
		method: 'GET',
		headers: {
			'User-Agent': 'tmstats.almostapps.eu / 0.0.3 matejbaco2000@gmail.com',
			Authorization: `Bearer ${accessToken}`
		}
	});
	const profileJson = await profileResponse.json();

	if (profileJson.message) {
		error(400, {
			message: json.message
		});
	}

	const userId = profileJson.accountId ?? profileJson.account_id ?? '';
	const displayName = profileJson.displayName ?? profileJson.display_name ?? 'Unknown user';

	await AppwriteService.serverStoreCredentials(
		APPWRITE_API_KEY,
		userId,
		accessToken,
		refreshToken,
		expireAt
	);

	const token = await AppwriteService.serverCreateSession(APPWRITE_API_KEY, userId, displayName);

	return {
		token,
		path
	};
};
