import { AppwriteService } from '$lib/appwrite';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	const gamifyData = Promise.all([
		AppwriteService.getDailyMaps(),
		AppwriteService.getWeeklyMaps(),
		AppwriteService.getCampaignMaps(),
		AppwriteService.getWeeklyGrandMaps()
	]).then(([dailyMaps, weeklyMaps, campaignMaps, weeklyGrandMaps]) => ({
		dailyMaps,
		weeklyMaps,
		campaignMaps,
		weeklyGrandMaps
	}));

	return { gamifyData };
};
