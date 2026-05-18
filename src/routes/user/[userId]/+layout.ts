import { AppwriteService, type AppwriteProfile } from '$lib/appwrite';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ params, url }) => {
	const profile = await AppwriteService.getProfile(params.userId);

	if (!profile) {
		return {
			profile: {
				$id: params.userId,
				$collectionId: '',
				$databaseId: '',
				$createdAt: '',
				$updatedAt: '',
				$permissions: [],
				silver: 0,
				bronze: 0,
				gold: 0,
				author: 0,
				nickname: 'NOT FOUND',
				score: 0,
				medals: '{}'
			} as AppwriteProfile,
			path: url.pathname
		};
	}

	return {
		profile,
		path: url.pathname
	};
};
