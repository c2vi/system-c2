
import { redirect, RedirectType } from 'next/navigation'
import { NextRequest, NextResponse } from "next/server";
import { init, id } from '@instantdb/admin';


export async function GET(req: NextRequest) {

	const APP_ID = '10daf44c-c553-4134-ac6d-ab20ec3d36e7';
	const db = init({
  		appId: APP_ID,
  		adminToken: process.env.INSTANT_APP_ADMIN_TOKEN,
		apiURI: process.env.INSTANT_API_URL,
  		websocketURI: process.env.INSTANT_WEBSOCKET_URL,
	});

	let discord_code = req.nextUrl.searchParams.get("code");

	const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			client_id: process.env.DISCORD_CLIENT_ID!,
			client_secret: process.env.DISCORD_CLIENT_SECRET!,
			grant_type: "authorization_code",
			code: discord_code,
			redirect_uri: "http://localhost:3001/api/callbackObsidian"
		}),
	});

	if (!tokenRes.ok) {
		console.log(await tokenRes.json());
		return NextResponse.json(
			{ error: "Failed to get discord token from code" },
			{ status: tokenRes.status }
		);
	}


	const tokens = await tokenRes.json();

	const userRes = await fetch("https://discord.com/api/users/@me", {
		headers: {
			Authorization: `Bearer ${tokens.access_token}`,
		},
	});

	if (!userRes.ok) {
		console.log(await userRes.json());
		return NextResponse.json(
			{ error: "Failed to fetch discord user info using token" },
			{ status: userRes.status }
		);
	}

	const user = await userRes.json();
	console.log("user email: ", user.email)

	const instant_token = await db.auth.createToken(user.email);
 
	return new NextResponse("The InstantToken: " + instant_token)
}

