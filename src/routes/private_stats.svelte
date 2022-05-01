<script>
	import { AppwriteService } from '../appwrite';

	(async () => {
		const data = await AppwriteService.getAppwrite().database.listDocuments(
			'dailyMaps',
			[],
			undefined,
			undefined,
			undefined,
			undefined,
			['bronzeDifficulty'],
			['ASC']
		);
		console.log(data);
	})();
</script>
