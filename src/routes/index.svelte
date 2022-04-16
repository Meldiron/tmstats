<script>
	let userId = '';
</script>

<div class="max-w-5xl w-full mx-auto mt-6 mb-6">
	<div class="mt-6 rounded-tl-3xl rounded-br-3xl bg-white border border-gray-200 p-4">
		<h1 class="font-bold text-black text-2xl mb-3">Trackmania Daily Stats</h1>

		<div class="prose">
			<p>Yearly view of your medals in daily maps. Current year: {new Date().getFullYear()}</p>

			<ul>
				<li>Meldiron: 06e99ad3-cded-4440-a19c-b3df4fda8004</li>
				<li>Dejwfík: 5ca1fa3a-3413-4863-86d7-7a47982abc1b</li>
				<li>Benko: f6fe29aa-45dc-4fe9-9a95-d5e2c39f6b5f</li>
			</ul>
		</div>
		<div class="mt-6 flex space-x-4">
			<input
				bind:value={userId}
				class="focus:outline-none focus:ring ring-slate-300 border border-slate-300 w-full max-w-sm bg-slate-200 p-2 rounded-md"
				type="text"
				placeholder="Your User ID"
			/>

			<a href={'/user/' + userId}>
				<button class="rounded-tl-3xl rounded-br-xl text-white bg-author-600 py-2 px-6 font-bold"
					>Visit Profile</button
				>
			</a>
		</div>
	</div>
</div>
