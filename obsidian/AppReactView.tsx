
import { ItemView, WorkspaceLeaf } from "obsidian";
import React from "react";
import ReactDOM from "react-dom/client";


function LoginObsidian() {
	const db = app.plugins.plugins["system-c2"].db
	const login = () => {
		const params = new URLSearchParams({
			client_id: "1407278617330843650",
			redirect_uri: "http://localhost:3001/api/callbackObsidian",
			response_type: "code",
			scope: "identify email",
		});
		window.location.href = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
	};
	
	const submit = () => {
		const input = document.getElementById("instant-token")
		console.log("InstantToken:", input.value)
		db.auth.signInWithToken(input.value)
	}

	return (
		<div>
			<button onClick={login}>Login with Discord (to get the InstantToken)</button>
			<p>   </p>
			Instant Token: <input id="instant-token"></input> <button onClick={submit}>Submit InstantToken</button>
		</div>
	);
}

export class AppReactView extends ItemView {
	root: ReactDOM.Root | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: SystemC2Plugin) {
		super(leaf);
		this.plugin = plugin
	}

	getViewType(): string {
		return "system-c2-react-view";
	}

	getDisplayText(): string {
		return "My React Tab";
	}

	async onOpen() {
		const db = this.plugin.db;

		function ObsidianApp() {
		  	return (
				<div>
					<db.SignedIn>
				  		<Dashboard />
					</db.SignedIn>
					<db.SignedOut>
				  		<LoginObsidian />
					</db.SignedOut>
			 	</div>
		  	);
		}

		function Dashboard() {

		  const user = db.useUser();

		  return <div>Signed in as: {user.email}</div>;
		}

		// create React root
		this.root = ReactDOM.createRoot(this.containerEl.children[1]);
		this.root.render(<ObsidianApp />);
	}

	async onClose() {
		this.root?.unmount();
	}
}


