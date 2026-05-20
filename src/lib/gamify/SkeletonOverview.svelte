<div class="mt-6 space-y-6">
	<!-- Hero Stats Row -->
	<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
		<!-- Rank Card Skeleton -->
		<div
			class="flex h-full flex-col justify-between rounded-tl-3xl rounded-br-3xl border border-gray-200 bg-white p-5"
		>
			<div>
				<div class="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
				<div class="h-8 w-40 bg-gray-200 rounded animate-pulse mb-4"></div>
				<div class="h-12 w-20 bg-gray-200 rounded animate-pulse mb-1"></div>
				<div class="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
			</div>
			<div>
				<div class="mt-4 h-4 w-full bg-gray-200 rounded animate-pulse mb-1"></div>
				<div class="h-3 w-full bg-gray-200 rounded-full animate-pulse mb-2"></div>
				<div class="flex gap-1">
					{#each Array(5) as _}
						<div class="h-1.5 flex-1 rounded-full bg-gray-200 animate-pulse"></div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Total Completion Skeleton -->
		<div class="rounded-tl-3xl rounded-br-3xl border border-gray-200 bg-white p-5">
			<div class="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4"></div>
			<div class="flex h-full flex-col justify-center space-y-4">
				{#each Array(4) as _}
					<div>
						<div class="mb-1 flex items-center justify-between">
							<div class="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
							<div class="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
						</div>
						<div class="h-2 w-full bg-gray-200 rounded-full animate-pulse"></div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Score Summary Skeleton -->
		<div class="rounded-tl-3xl rounded-br-3xl border border-gray-200 bg-white p-5">
			<div class="grid h-full grid-cols-2 gap-4">
				<div class="flex flex-col justify-center text-center">
					<div class="h-10 w-32 mx-auto bg-gray-200 rounded animate-pulse mb-1"></div>
					<div class="h-4 w-24 mx-auto bg-gray-200 rounded animate-pulse"></div>
				</div>
				<div class="flex flex-col justify-center text-center">
					<div class="h-10 w-32 mx-auto bg-gray-200 rounded animate-pulse mb-1"></div>
					<div class="h-4 w-24 mx-auto bg-gray-200 rounded animate-pulse"></div>
				</div>
				<div class="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-gray-50 py-2">
					<div class="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
					<div class="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
					<div class="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
				</div>
			</div>
		</div>
	</div>

	<!-- Category Mastery Skeleton -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
		{#each Array(3) as _}
			<div class="rounded-tl-3xl rounded-br-3xl border border-gray-200 bg-white p-4">
				<div class="mb-3 flex items-center justify-between">
					<div class="h-6 w-36 bg-gray-200 rounded animate-pulse"></div>
					<div class="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
				</div>
				<div class="h-3 w-full bg-gray-200 rounded-full animate-pulse mb-3"></div>
				<div class="mt-3 grid grid-cols-4 gap-2">
					{#each Array(4) as _}
						<div class="h-14 bg-gray-200 rounded-lg animate-pulse"></div>
					{/each}
				</div>
				<div class="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
					{#each Array(3) as _}
						<div class="text-center w-full">
							<div class="h-3 w-16 mx-auto bg-gray-200 rounded animate-pulse mb-1"></div>
							<div class="h-5 w-20 mx-auto bg-gray-200 rounded animate-pulse"></div>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<!-- Medal Distribution Skeleton -->
	<div class="rounded-tl-3xl rounded-br-3xl border border-gray-200 bg-white p-4">
		<div class="mb-3 flex items-baseline justify-between">
			<div class="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
			<div class="text-right">
				<div class="h-8 w-12 ml-auto bg-gray-200 rounded animate-pulse mb-1"></div>
				<div class="h-3 w-24 ml-auto bg-gray-200 rounded animate-pulse"></div>
			</div>
		</div>
		<div class="flex h-6 w-full overflow-hidden rounded-full">
			<div class="h-full w-full bg-gray-200 animate-pulse"></div>
		</div>
		<div class="mt-3 flex flex-wrap gap-3">
			{#each Array(5) as _}
				<div class="flex items-center gap-1.5">
					<div class="h-3 w-3 rounded-sm bg-gray-200 animate-pulse"></div>
					<div class="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
				</div>
			{/each}
		</div>
		<div class="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 sm:grid-cols-4">
			{#each Array(4) as _}
				<div class="text-center">
					<div class="h-8 w-12 mx-auto bg-gray-200 rounded animate-pulse mb-1"></div>
					<div class="h-4 w-24 mx-auto bg-gray-200 rounded animate-pulse mb-1"></div>
					<div class="h-3 w-16 mx-auto bg-gray-200 rounded animate-pulse"></div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Unfinished Business Skeleton -->
	<div>
		<div class="h-7 w-48 bg-gray-200 rounded animate-pulse mb-3"></div>
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _}
				<div class="rounded-tl-3xl rounded-br-3xl border border-gray-200 bg-white p-4">
					<div class="mb-2 flex items-center justify-between">
						<div class="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
						<div class="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
					</div>
					<div class="mb-1 flex justify-between">
						<div class="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
						<div class="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
					</div>
					<div class="h-2 w-full bg-gray-200 rounded-full animate-pulse"></div>
				</div>
			{/each}
		</div>
	</div>
</div>
