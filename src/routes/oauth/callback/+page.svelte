<script>
	import { goto } from '$app/navigation';
	import { AppwriteService } from '$lib/appwrite';

	let { data } = $props();

	(async () => {
		if (!data.token) {
			return;
		}

		try {
			await AppwriteService.createSession(data.token.userId, data.token.secret);
			await goto('/oauth/callback-authorize?path=' + encodeURIComponent(data.path));
		} catch (error) {
			await goto(data.path);
			console.error(error);
		}
	})();
</script>

<div class="mx-auto mt-16 flex max-w-2xl justify-center text-slate-500">
	<svg
		class="h-12 w-12 animate-spin"
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
	>
		<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
		<path
			class="opacity-75"
			fill="currentColor"
			d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
		/>
	</svg>
</div>
