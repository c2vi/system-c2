
import { ItemView, WorkspaceLeaf } from "obsidian";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "../app/page.tsx";

export class AppReactView extends ItemView {
	root: ReactDOM.Root | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return "system-c2-react-view";
	}

	getDisplayText(): string {
		return "My React Tab";
	}

	async onOpen() {
		// create React root
		this.root = ReactDOM.createRoot(this.containerEl.children[1]);
		this.root.render(<App />);
	}

	async onClose() {
		this.root?.unmount();
	}
}
