"use client";

import { id, i, init, InstaQLEntity } from "@instantdb/react";
import React, { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = "105800964171-moaemtcsl2127hsshaoj9deki34m8g0b.apps.googleusercontent.com";

const GOOGLE_CLIENT_NAME = "SystemC2";


// Optional: Declare your schema!
const schema = i.schema({
  entities: {
    todos: i.entity({
      text: i.string(),
      done: i.boolean(),
      createdAt: i.number(),
    }),
  },
  rooms: {
    todos: {
      presence: i.entity({}),
    },
  },
});

type Todo = InstaQLEntity<typeof schema, "todos">;

const db = init({
	appId: "10daf44c-c553-4134-ac6d-ab20ec3d36e7",
	apiURI: 'http://localhost:8888',
  	websocketURI: 'ws://localhost:8888/runtime/session',
	schema,
});


export default function App() {
  return (
    <div>
      <db.SignedIn>
        <Dashboard />
      </db.SignedIn>
      <db.SignedOut>
        <Login />
      </db.SignedOut>
    </div>
  );
}

function Dashboard() {
  // This component will only render if the user is signed in
  // so it's safe to call useUser here!
  const user = db.useUser();

  return <div>Signed in as: {user.email}</div>;
}

