import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, VimiumSettings, VimiumSettingTab } from './settings';
import { MarkerData } from './types';
import { createMarker, updateMarkerText, generateHints } from './utils';

export default class Vimium extends Plugin {
	settings: VimiumSettings;
	showMarkers = false;
    markers: Map<string, MarkerData> = new Map();
	containerEl: HTMLElement;
	input = "";

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'show-markers',
			name: 'Show markers',
			callback: () => {
				if (this.showMarkers) {
					this.destroyMarkers();
					this.input = "";
				}
				this.showMarkers = true;
				this.createMarkers();
			}
		});

		this.registerDomEvent(document, "keydown", (event: KeyboardEvent) => {
			if (!this.showMarkers) {
				return;
			}

			if (this.input !== "" && event.key === "Backspace") {
				this.input = this.input.slice(0, -1);
				this.updateMarkers();
			} else if (event.key === "Backspace" || event.key === "Escape") {
				this.showMarkers = false;
				this.input = "";
				this.destroyMarkers();
			} else if (event.key.length === 1 && event.key.match(/[a-zA-Z]/)) {
				this.input += event.key.toLowerCase();

                const result = this.markers.get(this.input);
				if (result) {
					// Interact with element
					const clickableEl = result.parentEl;
					if (clickableEl.getAttribute('contenteditable') === 'true') {
						clickableEl.focus();
					} else {
						clickableEl.click();
					}

					// Reset
					this.showMarkers = false;
					this.destroyMarkers();
					this.input = "";
				} else {
					this.updateMarkers();
				}
			}

			event.preventDefault();
		});

		this.registerDomEvent(document, "mousedown", () => {
			if (!this.showMarkers) {
				return;
			}

			this.showMarkers = false;
			this.input = "";
			this.destroyMarkers();
		});

		this.registerEvent(this.app.workspace.on("resize", () => {
			if (this.showMarkers) {
				this.updateMarkers();
			}
		}));

		this.addSettingTab(new VimiumSettingTab(this.app, this));
	}

	createMarkers() {
		// Select clickable elements
		const clickableElements = document.querySelectorAll(this.settings.clickableCssSelector);
        // Get all the clickable elements box rectangles prior adding elements
        // to the DOM, this way constant layout reflows are avoided.
        let elemsAndBounds: [HTMLElement, DOMRect][] = []; 
        clickableElements.forEach((el) => 
            elemsAndBounds.push([el as HTMLElement, el.getBoundingClientRect()])
        );
        // Filter out clickable elements out of the viewport.
        const boundaries = this.app.workspace.containerEl.getBoundingClientRect();
        elemsAndBounds = elemsAndBounds.filter((elem) => {
            const top = elem[1].top, left = elem[1].left;
            const width = elem[1].width, height = elem[1].height;
            return top >= 0 && top <= boundaries.height 
                && left >= 0 && left <= boundaries.width
                && width > 0 && height > 0;
        });


		// Create markers' container
		this.containerEl = createDiv();
		this.containerEl.addClass("vimium-container");
		this.app.workspace.containerEl.appendChild(this.containerEl);
		const containerInnerEl = createDiv();
		containerInnerEl.addClass("vimium-container-inner");
		this.containerEl.appendChild(containerInnerEl);
		this.containerEl.setCssProps({
			"--marker-size": `${this.settings.markerSize}px`,
		});

		// Create markers with hint strings.
		const hintChars = this.settings.hintChars;
		const hints = generateHints(elemsAndBounds.length, hintChars);
		for (const [index, hint] of hints.entries()) {
			const clickableEl = elemsAndBounds[index][0];
            const left = elemsAndBounds[index][1].left;
            const top = elemsAndBounds[index][1].top;
			const marker = createMarker(left, top, hint, clickableEl, this.input);
            this.markers.set(hint, marker);
            containerInnerEl.appendChild(marker.el);
		}
	}

	updateMarkers() {
		for (const marker of this.markers.values()) {
            if (marker.hint.startsWith(this.input)) {
                marker.el.setCssProps({ display: "block" });
                updateMarkerText(marker, this.input);
            } else {
                marker.el.setCssProps({ display: "none" });
            }
		}
	}

	destroyMarkers() {
		// Remove parent container
        this.app.workspace.containerEl.removeChild(this.containerEl);

		// Delete markers
		this.markers = new Map();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

