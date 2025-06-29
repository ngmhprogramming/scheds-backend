import express from "express";
import env from "dotenv";
import multer from "multer";
import cors from "cors";
import cookieParser from "cookie-parser";

import * as database from "./database.js";
import * as scheduler from "./scheduler.js";

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

app.get("/group/get-groups", async (req, res) => {
	// make sure user is logged in
	if (!("token" in req.cookies)) {
		res.send({ error: "User not logged in!" });
		return;
	}
	const access_token = req.cookies.token;

	const { data, error } = await database.getGroups(access_token);
	if (error == null) {
		res.send({ data: data });
		return;
	}
	res.send({ error: error });
	return;
});

app.post("/group/get-members", upload.none(), async (req, res) => {
	// make sure user is logged in
	if (!("token" in req.cookies)) {
		res.send({ error: "User not logged in!" });
		return;
	}
	const access_token = req.cookies.token;

	// validate request parameters
	if (!("groupId" in req.body)) {
		res.send({ error: "No group specified!" });
		return;
	}

	const group_id = req.body.groupId;

	const { data, error } = await database.getMembers(access_token, group_id);
	if (error == null) {
		res.send({ data: data });
		return;
	}
	res.send({ error: error });
	return;
});

app.post("/group/create", upload.none(), async (req, res) => {
	// make sure user is logged in
	if (!("token" in req.cookies)) {
		res.send({ error: "User not logged in!" });
		return;
	}

	// validate request parameters
	if (!("name" in req.body)) {
		res.send({ error: "No group name specified!" });
		return;
	}

	const access_token = req.cookies.token;
	const group_name = req.body.name;

	const { data, error } = await database.createGroup(access_token, group_name);
	if (error == null) {
		res.send({ data: "Success" });
		return;
	}
	res.send({ error: error });
	return;
})

app.post("/group/rename", upload.none(), async (req, res) => {
	// make sure user is logged in
	if (!("token" in req.cookies)) {
		res.send({ error: "User not logged in!" });
		return;
	}

	// validate request parameters
	if (!("groupId" in req.body)) {
		res.send({ error: "No group specified!" });
		return;
	}
	if (!("newName" in req.body)) {
		res.send({ error: "No new group name specified!" });
		return;
	}

	const access_token = req.cookies.token;
	const group_id = req.body.groupId;
	const new_name = req.body.newName;

	const { data, error } = await database.renameGroup(access_token, group_id, new_name);
	if (error == null) {
		res.send({ data: "Success" });
		return;
	}
	res.send({ error: error });
	return;
})

app.post("/group/add-member", upload.none(), async (req, res) => {
	// make sure user is logged in
	if (!("token" in req.cookies)) {
		res.send({ error: "User not logged in!" });
		return;
	}

	// validate request parameters
	if (!("groupId" in req.body)) {
		res.send({ error: "No group specified!" });
		return;
	}
	if (!("userId" in req.body)) {
		res.send({ error: "No user specified!" });
		return;
	}

	const access_token = req.cookies.token;
	const group_id = req.body.groupId;
	const user_id = req.body.userId;

	const { data, error } = await database.addToGroup(access_token, group_id, user_id);
	if (error == null) {
		res.send({ data: "Success" });
		return;
	}
	res.send({ error: error });
	return;
})

app.post("/group/remove-member", upload.none(), async (req, res) => {
	// make sure user is logged in
	if (!("token" in req.cookies)) {
		res.send({ error: "User not logged in!" });
		return;
	}

	// validate request parameters
	if (!("groupId" in req.body)) {
		res.send({ error: "No group specified!" });
		return;
	}
	if (!("userId" in req.body)) {
		res.send({ error: "No user specified!" });
		return;
	}

	const access_token = req.cookies.token;
	const group_id = req.body.groupId;
	const user_id = req.body.userId;

	const { data, error } = await database.removeFromGroup(access_token, group_id, user_id);
	if (error == null) {
		res.send({ data: "Success" });
		return;
	}
	res.send({ error: error });
	return;
});

app.post("/group/schedule-event", upload.none(), async (req, res) => {
	// make sure user is logged in
	if (!("token" in req.cookies)) {
		res.send({ error: "User not logged in!" });
		return;
	}
	// validate request parameters
	if (!("groupId" in req.body)) {
		res.send({ error: "No group ID specified!" });
		return;
	}

	const access_token = req.cookies.token;

	// Get users in the group
	const { data: groupData, error: groupError } = await database.getGroups(access_token);
	if (groupError != null) {
		res.send({ error: "Could not check if user is in group!" });
		return;
	}
	// Check if user is in the group
	const userInGroup = groupData.some(group => group.group_id === req.body.groupId);
	if (!userInGroup) {
		res.send({ error: "User is not in group!" });
		return;
	}

	// Get list of users in the group
	const { data: groupUserData, error: groupUserError } = await database.getMembers(access_token, req.body.groupId);
	if (groupUserError != null) {
		res.send({ error: "Could not retrieve members of group!" });
		return;
	}
	// Get events for users in the group
	const userEvents = await Promise.all(
		groupUserData.map(async user => {
			const { data: userEventsData, error: userEventsError } = await database.getEventsByUserId(user.user_id);
			if (userEventsError != null) {
				return { error: "Could not retrieve events for a user!" };
			}

			// Get username
			const { data: usernameData, error: usernameError } = await database.getUserProfile(user.user_id);
			return { username: usernameData.username, events: userEventsData };
		})
	);

	// Check if retrieval errored out for any user
	for (const userEvent of userEvents) {
		if (userEvent.error != null) {
			res.send(userEvent);
			return;
		}
	}

	// Call scheduler with event list
	const inputData = req.body;
	inputData.users = userEvents;
	const data = scheduler.findFreeSlots(inputData);
	res.send({ data: data });
	return;
});

app.post("/group/test-schedule-event", upload.none(), async (req, res) => {
	const users = [
		{
			username: 'alice',
			events: [
				{ start: '2025-07-01T02:00:00Z', end: '2025-07-01T03:00:00Z' },
			]
		},
		{
			username: 'bob',
			events: [
				{ start: '2025-07-01T01:00:00Z', end: '2025-07-01T02:30:00Z' },
			]
		},
		{
			username: 'carol',
			events: [
				{ start: '2025-07-01T04:00:00Z', end: '2025-07-01T05:00:00Z' },
			]
		}
	];
	const result = scheduler.findFreeSlots({
		users,
		searchStart: new Date('2025-07-01T00:00:00Z'),
		searchEnd: new Date('2025-07-01T06:00:00Z'),
		eventLength: 120,
		startHourRestriction: 0,
		endHourRestriction: 24,
		stepMinutes: 30,
		maxResults: 10,
	});
	console.log(result);
	res.send({ data: result });
	return;
});

app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});
