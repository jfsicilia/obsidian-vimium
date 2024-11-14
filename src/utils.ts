import { MarkerData } from "./types";

export function createMarkerText(hint: string, markerEl: HTMLElement, input = "") {
	Array.from(hint).forEach((char, index) => {
		const charEl = createSpan();
		charEl.setText(char.toUpperCase());
		if (input.length >= index && char === input[index]) {
			charEl.addClass("vimium-marker-char-match");
		}
		markerEl.appendChild(charEl);
	});
}

export function updateMarkerText(marker: MarkerData, input = "") {
    marker.el.innerHTML = "";
	createMarkerText(marker.hint, marker.el, input);
}

export function createMarkerEl(hint: string, input: string, x: number, y: number): HTMLElement {
	const markerEl = createSpan()
	markerEl.addClass("vimium-marker");
	markerEl.setCssProps({
		"--top": `${y}px`, 
		"--left": `${x}px`,
	});
	createMarkerText(hint, markerEl, input);
	return markerEl;
}

export function createMarker(posX: number, posY: number, hint: string, 
    parentEl: HTMLElement, input = ""): MarkerData {

    const el = createMarkerEl(hint, input, posX, posY);
	return { el, parentEl, hint: hint };
}

export function intToLetters(num: number) {
	return String.fromCharCode(97 + (num % 26));
}

/**
 * Generate hints using the `hintChars` character set. Hints can be of different
 * lengths and are sorted in a way that hints starting with the same character
 * are spread evenly.
 * @param numHints The number of hints to generate.
 * @param hintChars The characters to use for generating hints.
 * @returns An array of hints.
 */
export function generateHints(numHints: number, hintChars: string): string[] {
	if (!hintChars || hintChars.length == 0) return [];
	let hints = [""];
	let offset = 0;
	while (hints.length - offset < numHints || hints.length === 1) {
		const hint = hints[offset++];
		for (const ch of hintChars) {
			hints.push(ch + hint);
		}
	}
	// Slice the hints to the number of hints requested, discarding those that
	// share prefixes with other hints.
	hints = hints.slice(offset, offset + numHints);

	// Sort the hints and then reverse them, so that hints starting with the
	// same character prefix are spread evenly throughout the array.
	return hints.sort().map((hint) => hint.split("").reverse().join(""));
}
