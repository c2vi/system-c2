
import { Plugin, TFile, Vault, MetadataCache } from "obsidian";

export default class SystemC2Plugin extends Plugin {
	async onload() {
		// Listen for file modifications in the vault
		this.registerEvent(
			this.app.vault.on("modify", (file: TFile) => {
				this.handleFileUpdate(file);
			})
		);
	}

	async handleFileUpdate(file: TFile) {
		if (!(file instanceof TFile) || file.extension !== "md") {
			return; // only care about markdown files
		}

		const metadata = this.app.metadataCache.getFileCache(file);

		// Example: check if the file has a specific tag
		const hasTag = metadata?.frontmatter.tags.includes("t/otask");

		const isRrootOtask = file.basename === "my-projects";

		if (isRrootOtask) {
			console.log("modified otask-root note")

			const content = await this.app.vault.read(file);
		}

		if (hasTag && !isRrootOtask) {
			console.log("modified a otask note")
		}
	}
}




