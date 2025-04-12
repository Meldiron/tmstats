import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url }) => {
	const redirectUrl = encodeURIComponent(url.origin + '/oauth/callback');

	const urlParams = new URLSearchParams(url.search);
	const path = urlParams.get('path') ?? '';
	const pathEncoded = encodeURIComponent(path);

	const clientId = '5529e929151b2476f3c6';
	redirect(
		301,
		`https://api.trackmania.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_favorite&redirect_uri=${redirectUrl}&state=${pathEncoded}`
	);
};
