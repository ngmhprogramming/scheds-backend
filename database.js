import env from "dotenv";

import { createClient } from "@supabase/supabase-js";

env.config();

const supabase = createClient(process.env.DATABASE_URL, process.env.DATABASE_KEY);

export async function signUpNewUser(email, password) {
	const { data, error } = await supabase.auth.signUp({
		email: email,
		password: password,
	});
	console.log({ data, error });
	return { data, error };
}

export async function signInWithEmail(email, password) {
	const { data, error } = await supabase.auth.signInWithPassword({
		email: email,
		password: password,
	});
	console.log({ data, error });
	return { data, error };
}

export async function getUser(access_token) {
	const { data, error } = await supabase.auth.getUser(access_token);
	return { data, error };
}

export async function updateTest(access_token, username) {
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