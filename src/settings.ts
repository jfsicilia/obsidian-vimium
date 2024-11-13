import { App, ButtonComponent, PluginSettingTab, Setting } from "obsidian";
import { CLICKABLE_SELECTOR } from "./constants";
import Vimium from "./main";

export interface VimiumSettings {
	clickableCssSelector: string;
	markerSize: number;
	hintChars: string;
}

export const DEFAULT_SETTINGS: VimiumSettings = {
	clickableCssSelector: CLICKABLE_SELECTOR,
	markerSize: 12,
	hintChars: "sadjklewcmpgh",
}

export class VimiumSettingTab extends PluginSettingTab {
	plugin: Vimium;

	constructor(app: App, plugin: Vimium) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Link hints characters")
			.setDesc("Characters used for generating link hints. More characters generates shorter hints. Minimum 3 characters.")
			.addText((text) =>
				text
					.setPlaceholder("Characters...")
					.setValue(this.plugin.settings.hintChars)
					.onChange(async (value) => {
						if (!value || value.length < 3) 
                            value = DEFAULT_SETTINGS.hintChars;
						this.plugin.settings.hintChars = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Marker font size')
			.setDesc('The size of text in markers.')
			.addText(text => text
				.setValue(this.plugin.settings.markerSize.toString())
				.onChange(async (value) => {
					const num = parseInt(value);
					if (isNaN(num)) {
						this.plugin.settings.markerSize = DEFAULT_SETTINGS.markerSize;
					} else {
						this.plugin.settings.markerSize = num;
					}
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Clickable CSS selector')
			.setDesc('Used for selecting clickable HTML elements.')
			.addTextArea(text => text
				.setPlaceholder('CSS selector..')
				.setValue(this.plugin.settings.clickableCssSelector)
				.onChange(async (value) => {
					this.plugin.settings.clickableCssSelector = value;
					await this.plugin.saveSettings();
				}));

		new ButtonComponent(containerEl)
			.setButtonText("Reset")
			.setTooltip("Reset settings")
			.onClick(async () => {
				this.plugin.settings.clickableCssSelector = CLICKABLE_SELECTOR;
				await this.plugin.saveSettings();
				this.display();
			});
	}
}
