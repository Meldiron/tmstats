import { AppwriteService } from '$lib/appwrite';
import { error } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ params, url }) => {
	const profile = await AppwriteService.getProfile(params.userId);

	if (!profile) {
		error(404, {
			message: 'Profile not found'
		});
	}

	return {
		profile,
		path: url.pathname
	};
};
