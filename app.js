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

app.post("/signup", upload.none(), async (req, res) => {
	console.log(req.body.email);
	console.log(req.body.password);
	const supabaseResponse = await signUpNewUser(req.body.email, req.body.password);
	console.log(supabaseResponse);
	// some erorr handling here...
	res.send(supabaseResponse);
});

app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});
