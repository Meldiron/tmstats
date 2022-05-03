<script>
	import { AppwriteService } from '../appwrite';

	import { onMount } from 'svelte';

	onMount(() => {
		AppwriteService.ensureAuth();
	});
</script>

<slot />

<div class="mt-6 mb-6 max-w-5xl mx-auto text-slate-400 text-sm text-center">
	<p>
		TMStats is not affiliated with Nadeo or Ubisoft. All trademarks, logos and brand names are the
		property of their respective owners.
	</p>
</div>
