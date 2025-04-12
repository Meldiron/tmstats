import { AppwriteService, type AppwriteCampaignMap } from '$lib/appwrite';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const maps = await AppwriteService.getCampaignMaps();

	const campaigns: {
		uid: string;
		maps: AppwriteCampaignMap[];
	}[] = [];

	for (const map of maps) {
		const campaignUid = map.campaignUid;

		let campaign = campaigns.find((campaign) => campaign.uid === campaignUid);
		if (!campaign) {
			campaign = {
				uid: campaignUid,
				maps: []
			};
			campaigns.push(campaign);
		}

		campaign.maps.push(map);
	}

	for (const campaign of campaigns) {
		campaign.maps = campaign.maps.sort((a, b) => {
			return a.position - b.position;
		});
	}

	const campaignsSorted = campaigns.sort((a, b) => {
		const seasons = ['winter', 'spring', 'summer', 'fall'];
		const [seasonA, yearA] = a.uid.split('-');
		const [seasonB, yearB] = b.uid.split('-');

		if (yearA === yearB) {
			return seasons.indexOf(seasonB) - seasons.indexOf(seasonA);
		}

		if (yearA < yearB) {
			return 1;
		}

		if (yearA > yearB) {
			return -1;
		}

		return 0;
	});

	return {
		maps,
		campaigns: campaignsSorted
	};
};
