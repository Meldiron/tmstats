import { AppwriteService, type AppwriteDailyMaps } from '$lib/appwrite';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const maps = await AppwriteService.getDailyMaps();

	const months: {
		uid: string;
		maps: AppwriteDailyMaps[];
	}[] = [];

	for (const map of maps) {
		const monthUid = map.month + '-' + map.year;

		let month = months.find((month) => month.uid === monthUid);
		if (!month) {
			month = {
				uid: monthUid,
				maps: []
			};
			months.push(month);
		}

		month.maps.push(map);
	}

	for (const month of months) {
		month.maps = month.maps.sort((a, b) => {
			return a.day - b.day;
		});
	}

	const monthsSorted = months.sort((a, b) => {
		const [monthA, yearA] = a.uid.split('-');
		const [monthB, yearB] = b.uid.split('-');

		if (+yearA === +yearB) {
			return +monthB - +monthA;
		}

		return +yearB - +yearA;
	});

	return {
		maps,
		months: monthsSorted
	};
};
