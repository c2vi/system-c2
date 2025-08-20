
import { Plugin, TFile, Vault, MetadataCache } from "obsidian";
import { AppReactView } from "./AppReactView.tsx";
import { id, i, init, InstaQLEntity } from "@instantdb/react";
import remarkParse from 'remark-parse'
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { Root, Content, Heading, List, ListItem, Text } from "mdast";

export default class SystemC2Plugin extends Plugin {

	db = init({
		appId: "10daf44c-c553-4134-ac6d-ab20ec3d36e7",
		apiURI: 'http://localhost:8888',
  		websocketURI: 'ws://localhost:8888/runtime/session',
	});

	async onload() {
		// Listen for file modifications in the vault
		this.registerEvent(
			this.app.vault.on("modify", (file: TFile) => {
				this.handleFileUpdate(file);
			})
		);

		this.registerView(
			"system-c2-app",
			(leaf) => new AppReactView(leaf, this)
		);

		this.addCommand({
			id: "app",
			name: "Open SystemC2 App page",
			callback: async () => {
				const leaf = this.app.workspace.getLeaf(true);
				await leaf.setViewState({
					type: "system-c2-app",
					active: true,
				});
				this.app.workspace.revealLeaf(leaf);
			},
		});

		this.addCommand({
			id: "full-parse",
			name: "Parse all otask files into the db",
			callback: async () => {
				await full_parse(this.db)
			},
		});

	}

	async handleFileUpdate(file: TFile) {
		if (!(file instanceof TFile) || file.extension !== "md") {
			return; // only care about markdown files
		}

		const metadata = this.app.metadataCache.getFileCache(file);

		// Example: check if the file has a specific tag
		if (metadata?.frontmatter.tags.includes("t/otask")) {
			this.parseOtask(file)
		}

	}

	async parseOtask(file: TFile) {
		if (!this.isLoggedIn()) {
			return;
		}
		const isRrootOtask = file.basename === "my-projects";

		if (isRrootOtask) {

			return;
		}


	}

	async isLoggedIn() {
		const user = this.db.getAuth();
		user
	}


	onunload() {
		this.app.workspace.detachLeavesOfType("system-c2-app");
	}
}


// parsing helper functions

async function full_parse(db) {
	let otasks = [];

	const root_file = app.vault.getAbstractFileByPath("private/my-projects.md");
	const content = await app.vault.read(root_file);
	const list = await getListUnderHeading(content, "root");

	list.forEach(entry => {
		otasks = otasks.concat(otasks_from_list_item(entry))
	});

	console.log("otasks::", otasks)
}

function otasks_from_list_item(listItem) {
	let otasks = [];

	if (!listItem.children[0].type === "paragraph") {
		console.log("listItem[0] of a otask item is not a paragraph... the otask:", listItem)
		return otasks
	}
	const longName = nodeToString(listItem.children[0])
	const name = longName

	// check for [[anotherotask]], call otasks_from_file, return those
	

	//check of [x] and remove from name

	// go through sub list items
	// 	- if it's a prop for the otask... handle that
	// 	- if it's an "ac:" handle that
	// 	- if it's "ot: " handle as another otask -> recursive call
	// 	- if it's "[ ]" handle as another otask -> recursive call
	// 	- if it's a link to a otask file... handle as another otask -> call otasks_from_file()
	// 	- else add it as description item list to otask

	otasks.push({longName, name})

	return otasks;
}

function otasks_from_file(file: TFile) {
	let otasks = [];

	return otasks;
}

// Extract plain text from a node
function nodeToString(node: any): string {
	let result = "";
	visit(node, "text", (textNode: Text) => {
		result += textNode.value;
	});
	return result.trim();
}

async function getListUnderHeading(markdown: string, headingText: string): string[] {
	const tree: Root = unified().use(remarkParse).parse(markdown) as Root;
	console.log("tree", tree)

	let capture = false;
	let items: string[] = [];

	for (let i = 0; i < tree.children.length; i++) {
		const node: Content = tree.children[i];

		// Detect the target heading
		if (node.type === "heading" && nodeToString(node).toLowerCase() === headingText.toLowerCase()) {
			capture = true;
			continue;
		}

		// Stop if another heading of the same or higher level comes
		if (capture && node.type === "heading") {
			break;
		}

		// Collect list items if capturing
		if (capture && node.type === "list") {
			for (const li of (node as List).children) {
				if (li.type === "listItem") {
					items.push(li)
				}
			}
		}
	}

	return items;
}


