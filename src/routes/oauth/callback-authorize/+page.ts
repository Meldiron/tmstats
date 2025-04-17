import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url }) => {
	const urlParams = new URLSearchParams(url.search);
	const pathEncoded = urlParams.get('path');
	const path = decodeURIComponent(pathEncoded ?? '/');

	return { path };
};
