import { vibeFlagsStore } from '@vibe-flags/core';

vibeFlagsStore.register({
	key: 'warriorMedals',
	type: 'boolean',
	label: 'Show warrior medals?',
	default: false
});

function read(): boolean {
	return vibeFlagsStore.get('warriorMedals') === true;
}

class Flags {
	warriorMedals = $state(read());

	constructor() {
		window.addEventListener('vibe-flags-changed', (e: Event) => {
			const detail = (e as CustomEvent<{ key: string }>).detail;
			if (!detail || detail.key === 'warriorMedals') {
				this.warriorMedals = read();
			}
		});
	}
}

export const flags = new Flags();
