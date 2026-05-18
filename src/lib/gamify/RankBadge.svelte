<script lang="ts">
	import type { RankInfo } from './gamification';
	interface Props {
		rank: RankInfo;
	}
	let { rank }: Props = $props();

	const colorClasses: Record<string, string> = {
		author: 'bg-author-100 text-author-800 border-author-300',
		gold: 'bg-gold-100 text-gold-800 border-gold-300',
		silver: 'bg-silver-100 text-silver-800 border-silver-300',
		bronze: 'bg-bronze-100 text-bronze-800 border-bronze-300',
		gray: 'bg-gray-100 text-gray-800 border-gray-300'
	};

	const iconSvg: Record<string, string> = {
		Rookie:
			'<path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />',
		Challenger:
			'<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />',
		'Professional':
			'<path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />',
		Elite:
			'<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />',
		Trackmaster:
			'<path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.699-3.181a1 1 0 011.827 1.035L17.475 6H20a1 1 0 011 1v2a1 1 0 01-1 1h-1.177l-.483 4.305a1 1 0 01-1.864.318l-.727-2.18-2.958 1.184A1 1 0 0111 14.268V17a1 1 0 11-2 0v-2.732a1 1 0 01-.809-.987l-2.958-1.184-.727 2.18a1 1 0 01-1.864-.318L1.177 10H1a1 1 0 01-1-1V7a1 1 0 011-1h2.525l.005-.01 1.005-1.882a1 1 0 011.827-1.035L7.046 4.905 11 3.323V3a1 1 0 011-1z" clip-rule="evenodd" />'
	};
</script>

<div
	class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wide uppercase {colorClasses[
		rank.current.color
	] || colorClasses.gray}"
>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		class="h-3.5 w-3.5"
		viewBox="0 0 20 20"
		fill="currentColor"
	>
		{@html iconSvg[rank.current.baseRank] || iconSvg.Rookie}
	</svg>
	{rank.current.name}
</div>
