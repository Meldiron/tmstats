<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="mx-auto mt-[8rem] w-full max-w-5xl">
	<h1 class="mb-4 text-center text-3xl font-semibold">An error occured!</h1>

	<div
		class="mx-auto mt-6 flex w-[fit-content] flex-col items-center justify-between space-y-4 rounded-tl-3xl rounded-br-3xl border border-red-700 bg-red-500 p-4 text-white sm:flex-row sm:space-y-0"
	>
		<div class="flex items-center justify-start space-x-3">
			<div class="rounded-full bg-red-700 p-1 text-white">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</div>
			<p>{page.error.message}</p>
		</div>
	</div>

	<div class="mt-6 flex items-center justify-center">
		<a
			class="bg-author-500 enabled:hover:bg-author-600 rounded-tl-3xl rounded-br-3xl px-6 py-2 font-bold text-white disabled:opacity-50"
			href="/">Back to homepage</a
		>
	</div>
</div>
