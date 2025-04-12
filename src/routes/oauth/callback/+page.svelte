<script>
	import { goto, invalidateAll } from '$app/navigation';
	import { AppwriteService } from '$lib/appwrite';

	let { data } = $props();

	(async () => {
		try {
			await AppwriteService.createSession(data.token.userId, data.token.secret);
			await goto(data.path);
			await invalidateAll();
		} catch (error) {
			await goto(data.path);
			console.error(error);
		}
	})();
</script>
