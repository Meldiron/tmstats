#!/usr/bin/env node
/**
 * Backfill warriorScore for all existing map documents.
 *
 * Usage:
 *   APPWRITE_API_KEY="your-key" node scripts/backfill-warrior.mjs
 *
 * Add DRY_RUN=1 to preview without writing:
 *   DRY_RUN=1 APPWRITE_API_KEY="your-key" node scripts/backfill-warrior.mjs
 */

import { Client, Databases, Query } from 'node-appwrite';

const ENDPOINT = 'https://cloud.appwrite.io/v1';
const PROJECT_ID = 'tmStats';
const DATABASE_ID = 'default';
const COLLECTIONS = ['dailyMaps', 'weeklyMaps', 'weeklyGrandMaps', 'campaignMaps'];

const API_KEY = process.env.APPWRITE_API_KEY;
const DRY_RUN = process.env.DRY_RUN === '1';

if (!API_KEY) {
	console.error('Error: Set APPWRITE_API_KEY environment variable.');
	process.exit(1);
}

async function loadWarriorTimes() {
	console.log('Fetching warrior.json ...');
	const res = await fetch(
		'https://raw.githubusercontent.com/ezio416/tm-json/refs/heads/main/warrior.json'
	);
	if (!res.ok) throw new Error('Failed to fetch warrior.json: ' + res.status);
	const data = await res.json();

	const times = new Map();
	const categories = ['Grand', 'Seasonal', 'Weekly', 'Totd', 'Other'];
	for (const cat of categories) {
		const list = data[cat];
		if (!Array.isArray(list)) continue;
		for (const map of list) {
			if (map.mapUid && typeof map.warriorTime === 'number') {
				times.set(map.mapUid, map.warriorTime);
			}
		}
	}
	console.log(`Loaded ${times.size} warrior times.`);
	return times;
}

async function run() {
	const warriorTimes = await loadWarriorTimes();

	const client = new Client();
	client.setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
	const db = new Databases(client);

	let totalUpdated = 0;
	let totalSkipped = 0;
	let totalMissing = 0;
	const missingMaps = [];

	for (const collectionId of COLLECTIONS) {
		console.log(`\n--- Processing ${collectionId} ---`);
		let cursor = null;
		let pageCount = 0;

		do {
			const queries = [Query.limit(500)];
			if (cursor) queries.push(Query.cursorAfter(cursor));

			const { documents } = await db.listDocuments(DATABASE_ID, collectionId, queries);
			pageCount++;
			console.log(`  Page ${pageCount}: ${documents.length} docs`);

			for (const doc of documents) {
				const mapUid = doc.mapUid;
				const warriorTime = warriorTimes.get(mapUid);

				if (warriorTime === undefined) {
					totalMissing++;
					missingMaps.push({
						collection: collectionId,
						id: doc.$id,
						uid: mapUid,
						name: doc.name || '(no name)'
					});
					continue;
				}

				const existing = doc.warriorScore;
				if (existing === warriorTime) {
					totalSkipped++;
					continue;
				}

				if (DRY_RUN) {
					console.log(`  [DRY_RUN] Would update ${doc.$id}: warriorScore=${warriorTime}`);
					totalUpdated++;
					continue;
				}

				try {
					await db.updateDocument(DATABASE_ID, collectionId, doc.$id, {
						warriorScore: warriorTime
					});
					totalUpdated++;
				} catch (err) {
					console.error(`  Failed to update ${doc.$id}:`, err.message);
				}
			}

			cursor = documents.length > 0 ? documents[documents.length - 1].$id : null;
		} while (cursor);
	}

	console.log('\n=== Done ===');
	console.log(`Updated: ${totalUpdated}`);
	console.log(`Skipped (already correct): ${totalSkipped}`);
	console.log(`Missing in dataset: ${totalMissing}`);

	if (missingMaps.length > 0) {
		console.log('\n--- Maps missing in warrior dataset ---');
		for (const m of missingMaps) {
			console.log(`[${m.collection}] id=${m.id} | uid=${m.uid} | name="${m.name}"`);
		}
	}
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
