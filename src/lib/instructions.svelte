<script lang="ts">
	import { flags } from '$lib/flags.svelte';
</script>

<div class="mt-6 rounded-tl-3xl rounded-br-3xl border border-gray-200 bg-white p-5">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h2 class="text-lg font-bold text-gray-900">Points scoring</h2>
			<p class="text-xs text-gray-500">Points per medal tier</p>
		</div>

		<div class="grid {flags.warriorMedals ? 'grid-cols-5' : 'grid-cols-4'} gap-3">
			{#if flags.warriorMedals}
				<div class="flex flex-col items-center gap-1.5 rounded-xl bg-warrior-50 px-3 py-3">
					<img src="/warrior.png" class="h-6 w-6" alt="Warrior" />
					<span class="text-xs font-bold text-warrior-700">20 pts</span>
				</div>
			{/if}
			<div class="flex flex-col items-center gap-1.5 rounded-xl bg-author-50 px-3 py-3">
				<img src="/author.png" class="h-6 w-6" alt="Author" />
				<span class="text-xs font-bold text-author-700">12 pts</span>
			</div>
			<div class="flex flex-col items-center gap-1.5 rounded-xl bg-gold-50 px-3 py-3">
				<img src="/gold.png" class="h-6 w-6" alt="Gold" />
				<span class="text-xs font-bold text-gold-700">4 pts</span>
			</div>
			<div class="flex flex-col items-center gap-1.5 rounded-xl bg-silver-50 px-3 py-3">
				<img src="/silver.png" class="h-6 w-6" alt="Silver" />
				<span class="text-xs font-bold text-silver-700">2 pts</span>
			</div>
			<div class="flex flex-col items-center gap-1.5 rounded-xl bg-bronze-50 px-3 py-3">
				<img src="/bronze.png" class="h-6 w-6" alt="Bronze" />
				<span class="text-xs font-bold text-bronze-700">1 pt</span>
			</div>
		</div>
	</div>
</div>
