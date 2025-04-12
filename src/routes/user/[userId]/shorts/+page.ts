import { AppwriteService, type AppwriteWeeklyMaps } from '$lib/appwrite';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const maps = await AppwriteService.getWeeklyMaps();

	const weeks: {
		uid: string;
		maps: AppwriteWeeklyMaps[];
	}[] = [];

	for (const map of maps) {
		const weekUid = map.week + '-' + map.year;

		let week = weeks.find((week) => week.uid === weekUid);
		if (!week) {
			week = {
				uid: weekUid,
				maps: []
			};
			weeks.push(week);
		}

		week.maps.push(map);
	}

	for (const week of weeks) {
		week.maps = week.maps.sort((a, b) => {
			return a.position - b.position;
		});
	}

	const weeksSorted = weeks.sort((a, b) => {
		const [weekA, yearA] = a.uid.split('-');
		const [weekB, yearB] = b.uid.split('-');
		return +yearB - +yearA || +weekB - +weekA;
	});

	return {
		maps,
		weeks: weeksSorted
	};
};
