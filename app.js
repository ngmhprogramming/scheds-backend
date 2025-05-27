import express from "express";
import env from "dotenv";
import multer from "multer";

import { createClient } from "@supabase/supabase-js";

env.config();

const app = express();
const upload = multer();
const port = 3000;

const supabase = createClient(process.env.DATABASE_URL, process.env.DATABASE_KEY);

app.get("/", (req, res) => {
	res.send("Hello Lol!");
	return;
});

async function signUpNewUser(email, password) {
	const { data, error } = await supabase.auth.signUp({
		email: email,
		password: password,
	});
	console.log({ data, error });
	return { data, error };
}

async function signInWithEmail(email, password) {
	const { data, error } = await supabase.auth.signInWithPassword({
		email: email,
		password: password,
	});
	console.log({ data, error });
	return { data, error };
}

app.post("/signup", upload.none(), async (req, res) => {
	console.log("Signing up", req.body.email, req.body.password);
	const { data, error } = await signUpNewUser(req.body.email, req.body.password);
	if (error == null) {
		res.send(data);
		return;
	}
	if (error.code == "validation_failed") {
		res.send("Could not validate Email.");
		return;
	}
	if (error.code == "weak_password") {
		res.send("Password was too weak, ensure it has at least 6 characters.");
		return;
	}
	if (error.code == "user_already_exists") {
		res.send("A user with that email already exists.");
		return;
	}
	res.send(error);
	return;
});

app.post("/login", upload.none(), async (req, res) => {
	console.log("Signing in", req.body.email, req.body.password);
	const { data, error } = await signInWithEmail(req.body.email, req.body.password);
	if (error == null) {
		res.send(data);
		return;
	}
	if (error.code == "invalid_credentials") {
		res.send("Invalid login credentials.");
		return;
	}
	res.send({ data, error });
	return;
});

async function getUser(access_token) {
	const { data, error } = await supabase.auth.getUser(access_token);
	return { data, error };
}

async function updateTest(access_token, username) {
	const { data: userData, error: userError } = await getUser(access_token);
	if (userError != null) {
		return { data: userData, error: userError };
	}
	const user = userData.user;
	const { data, error } = await supabase
		.from("test")
		.upsert({
			user: user.id,
			username: username,
		}, { onConflict: "user" })
	return { data, error };
}


app.post("/test", upload.none(), async (req, res) => {
	const { data, error } = await updateTest(req.body.access_token, req.body.username);
	if (error == null) {
		res.send("Success");
		return;
	}
	if (error.code == "bad_jwt") {
		res.send("Invalid session token.");
		return;
	}
	res.send({ data, error });
	return;
});

app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});
