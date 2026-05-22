import type {
	AppwriteProfile,
	AppwriteDailyMaps,
	AppwriteWeeklyMaps,
	AppwriteCampaignMap
} from '$lib/appwrite';

export type MedalEntry = { medal: number; time?: number };

export interface CategoryStats {
	totalMaps: number;
	completedMaps: number;
	author: number;
	gold: number;
	silver: number;
	bronze: number;
	completionPercent: number;
	score: number;
	finishedGroups: number;
	totalGroups: number;
	authorPerfectGroups: number;
}

export interface RankTier {
	name: string;
	stage: number;
	threshold: number;
	color: string;
	baseRank: string;
}

export interface RankInfo {
	current: RankTier;
	next: RankTier | null;
	progress: number; // 0-1 progress within current stage
	pointsToNext: number;
}

export interface LevelInfo {
	level: number;
	currentXp: number;
	targetXp: number;
	progress: number;
}

export interface Achievement {
	id: string;
	name: string;
	description: string;
	icon: string;
	unlocked: boolean;
	tier: 'bronze' | 'silver' | 'gold' | 'author';
	progress?: { current: number; target: number };
}

export interface MapGroup {
	id: string;
	name: string;
	category: string;
	completedCount: number;
	totalCount: number;
	authorCount: number;
	goldCount: number;
	silverCount: number;
	bronzeCount: number;
	isFinished: boolean;
	isAuthorPerfect: boolean;
}

export interface Milestone {
	label: string;
	current: number;
	target: number;
	unit: string;
	category?: string;
}

export const RANKS: RankTier[] = [
	{ name: 'Rookie I', stage: 1, threshold: 0, color: 'gray', baseRank: 'Rookie' },
	{ name: 'Rookie II', stage: 2, threshold: 100, color: 'gray', baseRank: 'Rookie' },
	{ name: 'Rookie III', stage: 3, threshold: 200, color: 'gray', baseRank: 'Rookie' },
	{ name: 'Rookie IV', stage: 4, threshold: 300, color: 'gray', baseRank: 'Rookie' },
	{ name: 'Rookie V', stage: 5, threshold: 400, color: 'gray', baseRank: 'Rookie' },
	{ name: 'Challenger I', stage: 1, threshold: 500, color: 'bronze', baseRank: 'Challenger' },
	{ name: 'Challenger II', stage: 2, threshold: 750, color: 'bronze', baseRank: 'Challenger' },
	{ name: 'Challenger III', stage: 3, threshold: 1000, color: 'bronze', baseRank: 'Challenger' },
	{ name: 'Challenger IV', stage: 4, threshold: 1250, color: 'bronze', baseRank: 'Challenger' },
	{ name: 'Challenger V', stage: 5, threshold: 1500, color: 'bronze', baseRank: 'Challenger' },
	{ name: 'Professional I', stage: 1, threshold: 1750, color: 'silver', baseRank: 'Professional' },
	{ name: 'Professional II', stage: 2, threshold: 2250, color: 'silver', baseRank: 'Professional' },
	{
		name: 'Professional III',
		stage: 3,
		threshold: 2750,
		color: 'silver',
		baseRank: 'Professional'
	},
	{ name: 'Professional IV', stage: 4, threshold: 3250, color: 'silver', baseRank: 'Professional' },
	{ name: 'Professional V', stage: 5, threshold: 3750, color: 'silver', baseRank: 'Professional' },
	{ name: 'Elite I', stage: 1, threshold: 4250, color: 'gold', baseRank: 'Elite' },
	{ name: 'Elite II', stage: 2, threshold: 5250, color: 'gold', baseRank: 'Elite' },
	{ name: 'Elite III', stage: 3, threshold: 6250, color: 'gold', baseRank: 'Elite' },
	{ name: 'Elite IV', stage: 4, threshold: 7500, color: 'gold', baseRank: 'Elite' },
	{ name: 'Elite V', stage: 5, threshold: 8750, color: 'gold', baseRank: 'Elite' },
	{ name: 'Trackmaster I', stage: 1, threshold: 10000, color: 'author', baseRank: 'Trackmaster' },
	{ name: 'Trackmaster II', stage: 2, threshold: 11000, color: 'author', baseRank: 'Trackmaster' },
	{ name: 'Trackmaster III', stage: 3, threshold: 12000, color: 'author', baseRank: 'Trackmaster' },
	{ name: 'Trackmaster IV', stage: 4, threshold: 13000, color: 'author', baseRank: 'Trackmaster' },
	{ name: 'Trackmaster V', stage: 5, threshold: 14000, color: 'author', baseRank: 'Trackmaster' },
	{ name: 'Legend I', stage: 1, threshold: 16000, color: 'red', baseRank: 'Legend' },
	{ name: 'Legend II', stage: 2, threshold: 18000, color: 'red', baseRank: 'Legend' },
	{ name: 'Legend III', stage: 3, threshold: 20000, color: 'red', baseRank: 'Legend' },
	{ name: 'Legend IV', stage: 4, threshold: 22500, color: 'red', baseRank: 'Legend' },
	{ name: 'Legend V', stage: 5, threshold: 25000, color: 'red', baseRank: 'Legend' }
];

export const MONTH_NAMES = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December'
];

export function getRank(score: number): RankInfo {
	let currentIdx = RANKS.findLastIndex((r) => score >= r.threshold);
	if (currentIdx === -1) currentIdx = 0;
	const current = RANKS[currentIdx];
	const next = currentIdx < RANKS.length - 1 ? RANKS[currentIdx + 1] : null;
	const prevThreshold = currentIdx > 0 ? RANKS[currentIdx - 1].threshold : 0;
	const progress =
		next !== null
			? Math.min(1, Math.max(0, (score - current.threshold) / (next.threshold - current.threshold)))
			: 1;
	return {
		current,
		next,
		progress,
		pointsToNext: next ? next.threshold - score : 0
	};
}

export function getLevel(score: number): LevelInfo {
	const level = Math.floor(Math.sqrt(score / 100));
	const currentXp = level * level * 100;
	const targetXp = (level + 1) * (level + 1) * 100;
	const progress = Math.min(1, Math.max(0, (score - currentXp) / (targetXp - currentXp)));
	return { level, currentXp: score, targetXp, progress };
}

export function countCategoryMedals(
	maps: Array<{ key: string } & Record<string, any>>,
	medalPrefix: string,
	medals: Record<string, MedalEntry>
): CategoryStats {
	const totalMaps = maps.length;
	let completedMaps = 0;
	let author = 0,
		gold = 0,
		silver = 0,
		bronze = 0;
	let score = 0;

	for (const map of maps) {
		const entry = medals[`${medalPrefix}-${map.key}`];
		if (entry) {
			completedMaps++;
			if (entry.medal === 4) {
				author++;
				score += 12;
			} else if (entry.medal === 3) {
				gold++;
				score += 4;
			} else if (entry.medal === 2) {
				silver++;
				score += 2;
			} else if (entry.medal === 1) {
				bronze++;
				score += 1;
			}
		}
	}

	return {
		totalMaps,
		completedMaps,
		author,
		gold,
		silver,
		bronze,
		completionPercent: totalMaps > 0 ? completedMaps / totalMaps : 0,
		score,
		finishedGroups: 0,
		totalGroups: 0,
		authorPerfectGroups: 0
	};
}

export function getGroups(
	maps: any[],
	medals: Record<string, MedalEntry>,
	medalPrefix: string,
	groupKey: (map: any) => { id: string; name: string }
): MapGroup[] {
	const groups = new Map<string, MapGroup>();

	for (const map of maps) {
		const key = groupKey(map);
		if (!groups.has(key.id)) {
			groups.set(key.id, {
				id: key.id,
				name: key.name,
				category: medalPrefix,
				completedCount: 0,
				totalCount: 0,
				authorCount: 0,
				goldCount: 0,
				silverCount: 0,
				bronzeCount: 0,
				isFinished: false,
				isAuthorPerfect: false
			});
		}
		const group = groups.get(key.id)!;
		group.totalCount++;

		const entry = medals[`${medalPrefix}-${map.key}`];
		if (entry) {
			group.completedCount++;
			if (entry.medal === 4) group.authorCount++;
			else if (entry.medal === 3) group.goldCount++;
			else if (entry.medal === 2) group.silverCount++;
			else if (entry.medal === 1) group.bronzeCount++;
		}
	}

	for (const group of groups.values()) {
		group.isFinished = group.completedCount > 0;
		group.isAuthorPerfect = group.authorCount === group.totalCount;
	}

	return Array.from(groups.values());
}

export function getAllAchievements(
	profile: { score: number; author: number; gold: number; silver: number; bronze: number },
	medals: Record<string, MedalEntry>,
	categories: Record<string, CategoryStats>,
	totalMaps: number,
	completedMaps: number
): Achievement[] {
	const totalMedals = profile.author + profile.gold + profile.silver + profile.bronze;
	const hasCategoryMedals = (prefix: string) =>
		Object.keys(medals).some((k) => k.startsWith(prefix + '-'));
	const authorRatio = completedMaps > 0 ? profile.author / completedMaps : 0;

	const list: Achievement[] = [
		{
			id: 'first-steps',
			name: 'First Steps',
			description: 'Earn your first medal',
			icon: 'footprint',
			tier: 'bronze',
			unlocked: totalMedals >= 1
		},
		{
			id: 'bronze-beginnings',
			name: 'Bronze Beginnings',
			description: 'Earn your first bronze medal',
			icon: 'medal',
			tier: 'bronze',
			unlocked: profile.bronze >= 1
		},
		{
			id: 'silver-surfer',
			name: 'Silver Surfer',
			description: 'Earn your first silver medal',
			icon: 'sparkles',
			tier: 'silver',
			unlocked: profile.silver >= 1
		},
		{
			id: 'going-gold',
			name: 'Going Gold',
			description: 'Earn your first gold medal',
			icon: 'star',
			tier: 'gold',
			unlocked: profile.gold >= 1
		},
		{
			id: 'author-hunter',
			name: 'Author Hunter',
			description: 'Earn your first author medal',
			icon: 'crown',
			tier: 'author',
			unlocked: profile.author >= 1
		},
		{
			id: 'author-enthusiast',
			name: 'Author Enthusiast',
			description: 'Earn 10 author medals',
			icon: 'crown',
			tier: 'author',
			unlocked: profile.author >= 10,
			progress: { current: profile.author, target: 10 }
		},
		{
			id: 'author-master',
			name: 'Author Master',
			description: 'Earn 50 author medals',
			icon: 'crown',
			tier: 'author',
			unlocked: profile.author >= 50,
			progress: { current: profile.author, target: 50 }
		},
		{
			id: 'gold-rush',
			name: 'Gold Rush',
			description: 'Earn 50 gold medals',
			icon: 'star',
			tier: 'gold',
			unlocked: profile.gold >= 50,
			progress: { current: profile.gold, target: 50 }
		},
		{
			id: 'medaled-up',
			name: 'Medaled Up',
			description: 'Earn 100 total medals',
			icon: 'trophy',
			tier: 'silver',
			unlocked: totalMedals >= 100,
			progress: { current: totalMedals, target: 100 }
		},
		{
			id: 'heavy-hitter',
			name: 'Heavy Hitter',
			description: 'Earn 500 total medals',
			icon: 'trophy',
			tier: 'gold',
			unlocked: totalMedals >= 500,
			progress: { current: totalMedals, target: 500 }
		},
		{
			id: 'pb-1k',
			name: 'Point Break',
			description: 'Reach 1,000 points',
			icon: 'lightning',
			tier: 'bronze',
			unlocked: profile.score >= 1000,
			progress: { current: profile.score, target: 1000 }
		},
		{
			id: 'pb-5k',
			name: 'High Score',
			description: 'Reach 5,000 points',
			icon: 'lightning',
			tier: 'silver',
			unlocked: profile.score >= 5000,
			progress: { current: profile.score, target: 5000 }
		},
		{
			id: 'pb-10k',
			name: 'Legendary',
			description: 'Reach 10,000 points',
			icon: 'lightning',
			tier: 'author',
			unlocked: profile.score >= 10000,
			progress: { current: profile.score, target: 10000 }
		},
		{
			id: 'jack-trades',
			name: 'Jack of All Trades',
			description: 'Earn medals in all 4 categories',
			icon: 'globe',
			tier: 'silver',
			unlocked:
				hasCategoryMedals('totd') && hasCategoryMedals('shorts') && hasCategoryMedals('grand') && hasCategoryMedals('campaign')
		},
		{
			id: 'daily-driver',
			name: 'Daily Driver',
			description: 'Complete 100% of any track of the day month',
			icon: 'calendar',
			tier: 'gold',
			unlocked: (categories.totd?.finishedGroups ?? 0) > 0
		},
		{
			id: 'weekly-warrior',
			name: 'Weekly Warrior',
			description: 'Complete 100% of any week',
			icon: 'clock',
			tier: 'gold',
			unlocked: (categories.shorts?.finishedGroups ?? 0) > 0
		},
		{
			id: 'grand-master',
			name: 'Grand Master',
			description: 'Complete 100% of any grand week',
			icon: 'crown',
			tier: 'gold',
			unlocked: (categories.grands?.finishedGroups ?? 0) > 0
		},
		{
			id: 'campaign-conqueror',
			name: 'Campaign Conqueror',
			description: 'Complete 100% of any campaign',
			icon: 'flag',
			tier: 'gold',
			unlocked: (categories.campaign?.finishedGroups ?? 0) > 0
		},
		{
			id: 'perfectionist',
			name: 'Perfectionist',
			description: '100% completion in any category',
			icon: 'check-circle',
			tier: 'author',
			unlocked: Object.values(categories).some((c) => c.completionPercent >= 1)
		},
		{
			id: 'sharpshooter',
			name: 'Sharpshooter',
			description: '50% of completed maps are Author medals',
			icon: 'target',
			tier: 'author',
			unlocked: completedMaps > 0 && authorRatio >= 0.5
		},
		{
			id: 'dedicated',
			name: 'Dedicated',
			description: 'Reach 50% overall completion',
			icon: 'heart',
			tier: 'silver',
			unlocked: totalMaps > 0 && completedMaps / totalMaps >= 0.5,
			progress: { current: completedMaps, target: Math.ceil(totalMaps * 0.5) }
		},
		{
			id: 'obsessed',
			name: 'Obsessed',
			description: 'Reach 90% overall completion',
			icon: 'fire',
			tier: 'gold',
			unlocked: totalMaps > 0 && completedMaps / totalMaps >= 0.9,
			progress: { current: completedMaps, target: Math.ceil(totalMaps * 0.9) }
		},
		{
			id: 'completionist',
			name: 'Completionist',
			description: '100% overall completion',
			icon: 'check-badge',
			tier: 'author',
			unlocked: totalMaps > 0 && completedMaps === totalMaps,
			progress: { current: completedMaps, target: totalMaps }
		}
	];

	return list;
}

export function getNextMilestones(
	profile: { score: number; author: number; gold: number; silver: number; bronze: number },
	categories: Record<string, CategoryStats>,
	totalMaps: number,
	completedMaps: number
): Milestone[] {
	const milestones: Milestone[] = [];

	// Score milestones
	const scoreTargets = [500, 1000, 2000, 5000, 10000, 16000, 20000, 25000];
	const nextScore = scoreTargets.find((t) => t > profile.score);
	if (nextScore)
		milestones.push({
			label: 'Reach ' + nextScore.toLocaleString() + ' points',
			current: profile.score,
			target: nextScore,
			unit: 'pts'
		});

	// Author milestones
	const authorTargets = [1, 10, 25, 50, 100, 250];
	const nextAuthor = authorTargets.find((t) => t > profile.author);
	if (nextAuthor)
		milestones.push({
			label: 'Earn ' + nextAuthor + ' Author medals',
			current: profile.author,
			target: nextAuthor,
			unit: 'medals'
		});

	// Completion milestones
	const completionTargets = [0.25, 0.5, 0.75, 0.9, 1];
	const currentPct = totalMaps > 0 ? completedMaps / totalMaps : 0;
	const nextPct = completionTargets.find((t) => t > currentPct);
	if (nextPct)
		milestones.push({
			label: 'Reach ' + Math.round(nextPct * 100) + '% total completion',
			current: completedMaps,
			target: Math.ceil(nextPct * totalMaps),
			unit: 'maps'
		});

	// Category completion milestones
	for (const [catId, cat] of Object.entries(categories)) {
		if (cat.completionPercent < 1) {
			milestones.push({
				label: `Complete all ${catId === 'totd' ? 'Track of the day' : catId === 'shorts' ? 'Shorts' : catId === 'grands' ? 'Grands' : 'Campaign'} maps`,
				current: cat.completedMaps,
				target: cat.totalMaps,
				unit: 'maps',
				category: catId
			});
		}
	}

	// Sort by progress (closest first)
	return milestones
		.map((m) => ({ ...m, progress: m.target > 0 ? m.current / m.target : 1 }))
		.sort((a, b) => (b as any).progress - (a as any).progress)
		.slice(0, 4);
}

export function computeGamification(
	profile: AppwriteProfile,
	dailyMaps: AppwriteDailyMaps[],
	weeklyMaps: AppwriteWeeklyMaps[],
	campaignMaps: AppwriteCampaignMap[],
	weeklyGrandMaps: AppwriteWeeklyMaps[] = []
) {
	const medals = (profile.medals as unknown as Record<string, MedalEntry>) || {};

	const totdStats = countCategoryMedals(dailyMaps, 'cotd', medals);
	const shortsStats = countCategoryMedals(weeklyMaps, 'shorts', medals);
	const grandStats = countCategoryMedals(weeklyGrandMaps, 'grand', medals);
	const campaignStats = countCategoryMedals(campaignMaps, 'campaign', medals);

	// Compute perfect groups
	const totdGroups = getGroups(dailyMaps, medals, 'cotd', (m) => {
		return {
			id: `${m.month}-${m.year}`,
			name: `${MONTH_NAMES[m.month - 1]} ${m.year}`
		};
	});
	const shortsGroups = getGroups(weeklyMaps, medals, 'shorts', (m) => {
		return { id: `${m.week}-${m.year}`, name: `Week ${m.week}, ${m.year}` };
	});
	const grandGroups = getGroups(weeklyGrandMaps, medals, 'grand', (m) => {
		return { id: `${m.week}-${m.year}`, name: `Week ${m.week}, ${m.year}` };
	});
	const campaignGroups = getGroups(campaignMaps, medals, 'campaign', (m) => {
		const [season, year] = m.campaignUid.split('-');
		return {
			id: m.campaignUid,
			name: `${season.charAt(0).toUpperCase() + season.slice(1)} ${year}`
		};
	});

	totdStats.finishedGroups = totdGroups.filter((g) => g.isFinished).length;
	shortsStats.finishedGroups = shortsGroups.filter((g) => g.isFinished).length;
	grandStats.finishedGroups = grandGroups.filter((g) => g.isFinished).length;
	campaignStats.finishedGroups = campaignGroups.filter((g) => g.isFinished).length;

	totdStats.totalGroups = totdGroups.length;
	shortsStats.totalGroups = shortsGroups.length;
	grandStats.totalGroups = grandGroups.length;
	campaignStats.totalGroups = campaignGroups.length;

	totdStats.authorPerfectGroups = totdGroups.filter((g) => g.isAuthorPerfect).length;
	shortsStats.authorPerfectGroups = shortsGroups.filter((g) => g.isAuthorPerfect).length;
	grandStats.authorPerfectGroups = grandGroups.filter((g) => g.isAuthorPerfect).length;
	campaignStats.authorPerfectGroups = campaignGroups.filter((g) => g.isAuthorPerfect).length;

	const categories = { totd: totdStats, shorts: shortsStats, grands: grandStats, campaign: campaignStats };

	const totalMaps = dailyMaps.length + weeklyMaps.length + weeklyGrandMaps.length + campaignMaps.length;
	const completedMaps =
		totdStats.completedMaps + shortsStats.completedMaps + grandStats.completedMaps + campaignStats.completedMaps;

	const silverPlus = profile.silver + profile.gold + profile.author;
	const goldPlus = profile.gold + profile.author;

	const overall = {
		totalMaps,
		completedMaps,
		completionPercent: totalMaps > 0 ? completedMaps / totalMaps : 0,
		score: profile.score,
		author: profile.author,
		gold: profile.gold,
		silver: profile.silver,
		bronze: profile.bronze,
		silverPlus,
		goldPlus
	};

	const rank = getRank(profile.score);
	const level = getLevel(profile.score);

	const allGroups = [...totdGroups, ...shortsGroups, ...grandGroups, ...campaignGroups];
	const achievements = getAllAchievements(profile, medals, categories, totalMaps, completedMaps);
	const nextMilestones = getNextMilestones(profile, categories, totalMaps, completedMaps);

	// Best/worst category
	const catEntries: [string, CategoryStats][] = Object.entries(categories);
	let bestCategory: [string, CategoryStats] = ['totd', totdStats];
	let worstCategory: [string, CategoryStats] = ['totd', totdStats];

	if (catEntries.length > 0) {
		bestCategory = catEntries.reduce((a, b) =>
			a[1].completionPercent > b[1].completionPercent ? a : b
		);
		worstCategory = catEntries.reduce((a, b) =>
			a[1].completionPercent < b[1].completionPercent ? a : b
		);
	}

	// Year-level groups for COTD
	const totdYearGroups = getGroups(dailyMaps, medals, 'totd', (m) => {
		return { id: String(m.year), name: String(m.year) };
	});

	function getUnfinished(groups: MapGroup[], limit = 3): MapGroup[] {
		return groups
			.filter((g) => g.completedCount > 0 && g.completedCount < g.totalCount)
			.sort((a, b) => b.completedCount / b.totalCount - a.completedCount / a.totalCount)
			.slice(0, limit);
	}

	// Unfinished business: top unfinished groups across all categories, sorted globally by completion %
	const unfinishedBusiness = [
		...getUnfinished(totdGroups, 3),
		...getUnfinished(totdYearGroups, 3),
		...getUnfinished(shortsGroups, 3),
		...getUnfinished(grandGroups, 3),
		...getUnfinished(campaignGroups, 3)
	]
		.filter((g) => g.completedCount > 0 && g.completedCount < g.totalCount)
		.sort((a, b) => b.completedCount / b.totalCount - a.completedCount / a.totalCount)
		.slice(0, 12);

	return {
		overall,
		categories,
		rank,
		level,
		achievements,
		nextMilestones,
		finishedGroups: [
			{ label: 'Finished Months', count: totdStats.finishedGroups, total: totdGroups.length },
			{ label: 'Finished Weeks', count: shortsStats.finishedGroups, total: shortsGroups.length },
			{ label: 'Finished Grands', count: grandStats.finishedGroups, total: grandGroups.length },
			{
				label: 'Finished Campaigns',
				count: campaignStats.finishedGroups,
				total: campaignGroups.length
			}
		],
		insights: {
			bestCategory: { id: bestCategory[0], ...bestCategory[1] },
			worstCategory: { id: worstCategory[0], ...worstCategory[1] },
			unfinishedBusiness
		},
		allGroups
	};
}
