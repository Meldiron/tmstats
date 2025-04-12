// deno-lint-ignore-file no-explicit-any

import { getAxiod } from './deps.ts';
import { sdk } from './deps.ts';

export class OAuth {
	constructor(
		private db: sdk.Databases,
		private userId: string,
		private accessToken: string,
		private refreshToken: string,
		private expiresAt: number
	) {}

	async getToken() {
		if (this.isExpired()) {
			console.log('Refreshing OAuth');
			await this.refresh();
			await this.save();
		}

		return this.accessToken;
	}

	private async save() {
		await this.db.updateDocument('default', 'oauthTokens', this.userId, {
			accessToken: this.accessToken,
			refreshToken: this.refreshToken,
			expiresAt: this.expiresAt
		});
	}

	private isExpired() {
		return Date.now() > this.expiresAt;
	}

	private async refresh() {
		// Client Token
		const authRes = await (
			await getAxiod()
		).post(
			'https://api.trackmania.com/api/access_token',
			`grant_type=refresh_token&refresh_token=${this.refreshToken}&client_id=${Deno.env.get('TRACKMANIA_OAUTH_CLIENT_ID')}&client_secret=${Deno.env.get('TRACKMANIA_OAUTH_CLIENT_SECRET')}`,
			{
				headers: {
					'User-Agent': 'tmstats.almostapps.eu / 0.0.3 matejbaco2000@gmail.com',
					'Content-Type': 'application/x-www-form-urlencoded'
				}
			}
		);

		console.log(authRes.data);

		this.accessToken = authRes.data.access_token;
		this.refreshToken = authRes.data.refresh_token;

		const expireIn = authRes.data.expires_in - 60; // in seconds
		this.expiresAt = Date.now() + expireIn * 1000;
	}
}
