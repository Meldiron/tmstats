import { AppwriteService } from '$lib/appwrite';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ params, url }) => {
	const profile = await AppwriteService.getProfile(params.userId);

	if (!profile) {
		return {
			profile: {
				$id: params.userId,
				silver: 0,
				bronze: 0,
				gold: 0,
				author: 0,
				nickname: 'NOT FOUND',
				score: 0,
				medals: {}
			},
			path: url.pathname
		};
	}

	return {
		profile,
		path: url.pathname
	};
};
