import { AppwriteService } from '$lib/appwrite';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	const gamifyData = Promise.all([
		AppwriteService.getDailyMaps(),
		AppwriteService.getWeeklyMaps(),
		AppwriteService.getCampaignMaps()
	]).then(([dailyMaps, weeklyMaps, campaignMaps]) => ({
		dailyMaps,
		weeklyMaps,
		campaignMaps
	}));

	return { gamifyData };
};
