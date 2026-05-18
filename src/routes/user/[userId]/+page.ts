import { AppwriteService } from '$lib/appwrite';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const [dailyMaps, weeklyMaps, campaignMaps] = await Promise.all([
		AppwriteService.getDailyMaps(),
		AppwriteService.getWeeklyMaps(),
		AppwriteService.getCampaignMaps()
	]);

	return { dailyMaps, weeklyMaps, campaignMaps };
};
