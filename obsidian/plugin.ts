
import { Plugin, TFile, Vault, MetadataCache } from "obsidian";
import { AppReactView } from "./AppReactView.tsx";
import { id, i, init, InstaQLEntity } from "@instantdb/react";
import remarkParse from 'remark-parse'
import remarkStringify from "remark-stringify";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { Root, Content, Heading, List, ListItem, Text } from "mdast";
import remarkFrontmatter from 'remark-frontmatter'

const OTASK_PROP_NAMES = ["short", "outcome", "priority"]
const ACTION_PROP_NAMES = []

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

		full_parse(this.db)
	}

	async handleFileUpdate(file: TFile) {
		if (!(file instanceof TFile) || file.extension !== "md") {
			return; // only care about markdown files
		}

		const metadata = this.app.metadataCache.getFileCache(file);

		// Example: check if the file has a specific tag
		if (metadata?.frontmatter?.tags?.includes("t/otask")) {
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

	for (const entry of list) {
		otasks = otasks.concat(await otasks_from_list_item(entry, []))
	}

	console.log("otasks::", otasks)
}

async function otasks_from_list_item(listItem, otask_path, priority = 0) {
	let otasks = [];

	// the main otask this listItem is about
	let otask = {
		description: [],
		actions: [],
		path: [],
		priority,
	};
	console.log("SystemC2: otasks_from_list_item", listItem, otask_path)

	if (!listItem.children[0].type === "paragraph") {
		console.log("listItem[0] of a otask item is not a paragraph... the otask:", listItem)
		return otasks
	}
	let longName = nodeToString(listItem.children[0])

	console.log("SystemC2: otasks_from_list_item longName:", longName)


	// check for [[anotherotask]], call otasks_from_file, return those
	const match = longName.match(/\[\[([^\]]+)\]\]/);
	if (match) {
		console.log("file: hereeeeeeeeeeeeee")
		const file = app.metadataCache.getFirstLinkpathDest(match[1], "");
		if (file) {
			const metadata = app.metadataCache.getFileCache(file);

			if (metadata?.frontmatter?.tags?.includes("t/otask")) {
				otasks = otasks.concat(await otasks_from_file(file, otask_path))
				return otasks;
			} else {
				console.log("SystemC2: listItem with Link to '", match[1] , "', which is not an otask", longName)
			}
		}
	}
	
	//check for [x] and remove from name
	if (longName.startsWith("[ ") || longName.startsWith("[x")) {
		longName = longName.slice(4)
	}

	//check for "ot:" and remove from name
	if (longName.startsWith("ot:")) {
		longName = longName.slice(4)
	}

	otask.longName = longName
	otask.short = longName
	otask.path = otask_path
	let new_otask_path = [... otask_path, otask.short]
	otasks.push(otask)

	// go through sub list items
	// 	- if it's a prop for the otask... handle that
	// 	- if it's an "ac:" handle that
	// 	- if it's "ot: " handle as another otask -> recursive call
	// 	- if it's "[ ]" handle as another otask -> recursive call
	// 	- if it's a link to a otask file... handle as another otask -> call otasks_from_file()
	// 	- else add it as description item list to otask
	if (!listItem.children || listItem.children.length < 2) {
		return otasks;
	}
	for (const subListItem of listItem.children[1].children){

		let text = nodeToString(subListItem.children[0])

		// check prop
		if (check_otask_prop_from_text(text, otask)) {
			new_otask_path = [... otask_path, otask.short] // have to redo it here, in case short changed from aprop
			continue; // don't do any other processing on this sub-listItem
		}

		// remove "[ ]"
		if (text.startsWith("[ ") || text.startsWith("[x")) {
			text = text.slice(4)
		}

		// check ac
		if (text.startsWith("ac:")) {
			otask.actions = [...otask.actions, action_from_list_item(subListItem, new_otask_path, otask.priority)]

			continue; // don't do any other processing on this sub-listItem
		}

		// check ot
		if (text.startsWith("ot:")) {
			otasks = otasks.concat(await otasks_from_list_item(subListItem, new_otask_path, otask.priority))

			continue; // don't do any other processing on this sub-listItem
		}

		// check [ ]
		if (text.startsWith("[ ] ") || text.startsWith("[x] ")) {
			otasks = otasks.concat(await otasks_from_list_item(subListItem, new_otask_path, otask.priority))

			continue; // don't do any other processing on this sub-listItem
		}

		// check link to otask file
		const match = text.match(/\[\[([^\]]+)\]\]/);
		if (match) {
			const file = app.metadataCache.getFirstLinkpathDest(match[1], "");
			if (file) {
				const metadata = app.metadataCache.getFileCache(file);

				if (metadata?.frontmatter?.tags?.includes("t/otask")) {
					otasks = otasks.concat(await otasks_from_file(file, new_otask_path, otask.priority))
					continue;
				} else {
					console.log("SystemC2: listItem with Link to '", match[1] , "', which is not an otask", longName)
				}

				continue; // don't do any other processing on this sub-listItem
			}
		}

		// add as description
		const desc = unified().use(remarkStringify).stringify(subListItem)
		otask.description.push(desc)
	}

	return otasks;
}



async function otasks_from_file(file: TFile, otask_path, priority = 0) {
	console.log("SystemC2: otasks_from_file", file, otask_path)

	let otasks = [];

	// the main otask this file is about
	let otask = {
		description: [],
		actions: [],
		path: [],
		priority,
	};

	otask.longName = file.basename
	otask.short = otask.longName
	otask.path = otask_path
	let new_otask_path = [...otask_path, otask.short]

	const content = await app.vault.read(file);

	// parse listItems at the top... for props
	const topListItems = getListItemsBeforeFirstHeading(content)
	for (const topListItem of topListItems) {
		const text = nodeToString(topListItem)

		// check for prop
		if (check_otask_prop_from_text(text, otask)) {
			new_otask_path = [...otask_path, otask.short]
			continue; // don't do any other processing on this sub-listItem
		}
	}

	// parse all the sub sections
	const SUB_COUNT = 10
	for (let sub_number = 0; sub_number < SUB_COUNT; sub_number++) {
		let listItems = await getListUnderHeading(content, "sub"+sub_number)

		// "sub" without a number should have priority 5
		if (sub_number == 5) {
			listItems = listItems.concat(await getListUnderHeading(content, "sub"))
		}

		console.log(`sub section ${sub_number} has items:`, listItems)

		for (const listItem of listItems) {
			otasks = otasks.concat(await otasks_from_list_item(listItem, new_otask_path, otask.priority+sub_number))
		}
	}

	otasks.push(otask)
	return otasks;
}



function action_from_list_item(listItem, otask_path) {
	console.log("SystemC2: action_from_list_item", listItem, otask_path)
	let action = {}

	action.name = nodeToString(listItem.children[0]).slice(4)

	return action
}



function check_otask_prop_from_text(text, otask) {
	for (const prop_name of OTASK_PROP_NAMES) {
		if (text.startsWith(prop_name + ":")) {
			const value = text.slice(prop_name.length + 2)

			if (prop_name == "priority") {
				otask[prop_name] = parseInt(value)
			} else {
				otask[prop_name] = value
			}

			return true;
		}
	}
	return false;
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
	const tree = unified().use(remarkParse).parse(markdown);
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


export function getListItemsBeforeFirstHeading(markdown: string) {
	const tree = unified().use(remarkParse).use(remarkFrontmatter, ['yaml', 'toml']).parse(markdown);

	let items = [];

	for (const node of tree.children) {
		if (node.type === "heading") {
			// stop at first heading
			break;
		}
		if (node.type === "list") {
			for (const li of (node as List).children) {
				if (li.type === "listItem") {
					items.push(li)
				}
			}
		}
	}

	return items;
}


