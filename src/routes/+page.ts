import { AppwriteService } from '$lib/appwrite';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const leaderboard = await AppwriteService.listProfiles(25);

	return {
		leaderboard
	};
};
