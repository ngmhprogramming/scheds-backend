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
	}
	if (error.code == "validation_failed") {
		res.send("Could not validate Email.");
	}
	if (error.code == "weak_password") {
		res.send("Password was too weak, ensure it has at least 6 characters.");
	}
	if (error.code == "user_already_exists") {
		res.send("A user with that email already exists.");
	}
	res.send(error);
});

app.post("/login", upload.none(), async (req, res) => {
	console.log("Signing in", req.body.email, req.body.password);
	const { data, error } = await signInWithEmail(req.body.email, req.body.password);
	if (error == null) {
		res.send(data);
	}
	if (error == "invalid_credentials") {
		res.send("Invalid login credentials.");
	}
	res.send({ data, error });
});

app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});
