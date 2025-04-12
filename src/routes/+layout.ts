export const ssr = false;

import { AppwriteService } from '$lib/appwrite';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => {
	const user = await AppwriteService.getAccount();

	return {
		user
	};
};
