import express from "express";
import env from "dotenv";
import multer from "multer";

import * as database from "./database.js";

env.config();

const app = express();
const upload = multer();
const port = 3000;

app.get("/", (req, res) => {
	res.send("Hello Lol!");
	return;
});

app.post("/signup", upload.none(), async (req, res) => {
	console.log("Signing up", req.body.email, req.body.password);
	const { data, error } = await database.signUpNewUser(req.body.email, req.body.password);
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
	const { data, error } = await database.signInWithEmail(req.body.email, req.body.password);
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

app.post("/test", upload.none(), async (req, res) => {
	const { data, error } = await database.updateTest(req.body.access_token, req.body.username);
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
