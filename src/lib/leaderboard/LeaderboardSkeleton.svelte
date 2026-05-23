<div class="divide-y divide-gray-50">
	{#each Array(5) as _}
		<div class="flex flex-col gap-3 border-l-4 border-l-gray-100 py-4 px-4 md:flex-row md:items-center md:gap-5">
			<!-- Rank + Player Info -->
			<div class="flex items-center gap-3 md:w-[240px] lg:w-[300px] md:shrink-0">
				<div class="w-10 text-center md:w-12">
					<div class="h-7 w-7 mx-auto bg-gray-200 rounded animate-pulse"></div>
				</div>
				<div class="min-w-0 flex-1 space-y-2">
					<div class="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
					<div class="flex flex-wrap items-center gap-2">
						<div class="h-5 w-24 bg-gray-200 rounded-full animate-pulse"></div>
						<div class="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
					</div>
				</div>
			</div>

			<!-- Medal Distribution Bar + Legend -->
			<div class="min-w-0 flex-1 space-y-2">
				<div class="h-2 w-full bg-gray-200 rounded-full animate-pulse"></div>
				<div class="flex flex-wrap gap-x-3 gap-y-1">
					{#each Array(4) as _}
						<div class="flex items-center gap-1.5">
							<div class="h-2.5 w-2.5 rounded-sm bg-gray-200 animate-pulse"></div>
							<div class="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Arrow -->
			<div class="hidden items-center justify-end md:flex md:w-12 md:shrink-0">
				<div class="h-9 w-9 rounded-full bg-gray-200 animate-pulse"></div>
			</div>
		</div>
	{/each}
</div>
