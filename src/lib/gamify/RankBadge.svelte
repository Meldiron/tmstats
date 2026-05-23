<script lang="ts">
	import type { RankInfo } from './gamification';
	interface Props {
		rank: RankInfo;
	}
	let { rank }: Props = $props();

	const colorClasses: Record<string, string> = {
		author: 'bg-[#14b5831a] text-[#14b583] border-[#14b58340]',
		gold: 'bg-[#ffd7001a] text-[#d4a000] border-[#ffd70040]',
		silver: 'bg-[#c0c0c01a] text-[#888888] border-[#c0c0c040]',
		bronze: 'bg-[#cd7f321a] text-[#cd7f32] border-[#cd7f3240]',
		gray: 'bg-gray-100 text-gray-800 border-gray-300',
		blue: 'bg-blue-100 text-blue-800 border-blue-300',
		rose: 'bg-[#9c00261a] text-[#9c0026] border-[#9c002640]'
	};

</script>

<div
	class="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase {colorClasses[
		rank.current.color
	] || colorClasses.gray}"
>
	{rank.current.name}
</div>
