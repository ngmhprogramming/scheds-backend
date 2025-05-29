import express from "express";
import env from "dotenv";
import multer from "multer";
import cors from "cors";

import * as database from "./database.js";

env.config();

const app = express();
const upload = multer();
const port = process.env.SERVER_PORT;
const frontendURL = process.env.FRONTEND_URL;

app.use(cors({
	origin: frontendURL,
	methods: ["GET", "POST", "PUT", "DELETE"],
	credentials: true,
}));

app.get("/", (req, res) => {
	res.redirect("https://scheds.ngmunhin.com/");
	return;
});

app.post("/signup", upload.none(), async (req, res) => {
	if (!("username" in req.body)) {
		res.send({ error: "No username specified!" });
		return;
	}
	if (!("email" in req.body)) {
		res.send({ error: "No email specified!" });
		return;
	}
	if (!("password" in req.body)) {
		res.send({ error: "No password specified!" });
		return;
	}
	const username = req.body.username;
	const email = req.body.email;
	const password = req.body.password;

	const { data, error } = await database.signUpNewUser(username, email, password);
	if (error == null) {
		res.cookie("token", data.session.access_token, {
			httpOnly: true,
			secure: process.env.SERVER_ENV === "prod",
			sameSite: (process.env.SERVER_ENV === "prod" ? "none" : "lax"),
		});
		res.send({ data: username });
		return;
	}
	if (error.code == "validation_failed") {
		res.send({ error: "Could not validate Email." });
		return;
	}
	if (error.code == "weak_password") {
		res.send({ error: "Password was too weak, ensure it has at least 6 characters." });
		return;
	}
	if (error.code == "user_already_exists") {
		res.send({ error: "A user with that email already exists." });
		return;
	}
	res.send({ error: error });
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
