import express from "express";
import env from "dotenv";
import multer from "multer";
import cors from "cors";
import cookieParser from "cookie-parser";

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

app.use(cookieParser());

app.get("/", (req, res) => {
	res.redirect("https://scheds.ngmunhin.com/");
	return;
});

app.post("/signup", upload.none(), async (req, res) => {
	// validate request parameters
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
		res.cookie("token", data.token, {
			httpOnly: true,
			secure: process.env.SERVER_ENV === "prod",
			sameSite: (process.env.SERVER_ENV === "prod" ? "none" : "lax"),
		});
		res.send({ data: data.profileData });
		return;
	}
	res.send({ error: error });
	return;
});

app.post("/login", upload.none(), async (req, res) => {
	const { data, error } = await database.signInWithEmail(req.body.email, req.body.password);
	if (error == null) {
		res.cookie("token", data.token, {
			httpOnly: true,
			secure: process.env.SERVER_ENV === "prod",
			sameSite: (process.env.SERVER_ENV === "prod" ? "none" : "lax"),
		});
		res.send({ data: data.profileData });
		return;
	}
	res.send({ error: error });
	return;
});

app.post("/logout", upload.none(), async (req, res) => {
	res.cookie("token", "", {
		httpOnly: true,
		secure: process.env.SERVER_ENV === "prod",
		sameSite: (process.env.SERVER_ENV === "prod" ? "none" : "lax"),
		expires: new Date(0),
	});
	res.send({ data: "Successfully logged out!" });
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

app.post("/schedule/create-event", upload.none(), async (req, res) => {
	// make sure user is logged in
	if (!("token" in req.cookies)) {
		res.send({ error: "User not logged in!" });
		return;
	}

	// validate request parameters
	if (!("title" in req.body)) {
		res.send({ error: "No title specified!" });
		return;
	}
	if (!("start" in req.body)) {
		res.send({ error: "No start time specified!" });
		return;
	}
	if (!("end" in req.body)) {
		res.send({ error: "No end time specified!" });
		return;
	}
	if (!("description" in req.body)) {
		req.body.description = "";
	}

	const access_token = req.cookies.token;

	const { data, error } = await database.createEvent(access_token, req.body);
	if (error == null) {
		res.send({ data: "Success" });
		return;
	}
	res.send({ error: error });
	return;
});

app.get("/schedule/events", async (req, res) => {
	// make sure user is logged in
	if (!("token" in req.cookies)) {
		res.send({ error: "User not logged in!" });
		return;
	}
	const access_token = req.cookies.token;

	const { data, error } = await database.getEvents(access_token);
	if (error == null) {
		res.send({ data: data });
		return;
	}
	res.send({ error: error });
	return;
});

app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});
