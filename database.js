import env from "dotenv";

import { createClient } from "@supabase/supabase-js";

env.config();

const supabase = createClient(process.env.DATABASE_URL, process.env.DATABASE_KEY);

export async function signUpNewUser(username, email, password) {
	// check if username is already in use
	const { data: existingUser, error: existingError } = await supabase
		.from("profiles")
		.select("user_id")
		.eq("username", username)
		.single();
	if (existingUser) {
		return { error: "Username is already taken" };
	}
	// register user
	const { data: signupData, error: signupError } = await supabase.auth.signUp({
		email: email,
		password: password,
	});
	if (signupError) {
		if (signupError.code == "validation_failed") {
			return { error: "Could not validate Email." };
		}
		if (signupError.code == "weak_password") {
			return { error: "Password was too weak, ensure it has at least 6 characters." };
		}
		if (signupError.code == "user_already_exists") {
			return { error: "A user with that email already exists." };
		}
		return { error: signupError };
	}
	// create user profile
	const token = signupData.session.access_token;
	const uuid = signupData.user.id;
	const { data: profileData, error: profileError } = await supabase
		.from("profiles")
		.insert({
			user_id: uuid,
			username: username,
		})
		.select()
		.single();
	return { data: { profileData: profileData, token: token }, error: profileError };
}

export async function signInWithEmail(email, password) {
	const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
		email: email,
		password: password,
	});
	if (loginError) {
		if (loginError.code == "invalid_credentials") {
			return { error: "Invalid login credentials." };
		}
		return { error: loginError };
	}
	const token = loginData.session.access_token;
	const uuid = loginData.user.id;
	const { data: profileData, error: profileError } = await supabase
		.from("profiles")
		.select("*")
		.eq("user_id", uuid)
		.single();
	return { data: { profileData: profileData, token: token }, error: profileError };
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
		}, { onConflict: "user" });
	return { data, error };
}

export async function createEvent(access_token, eventData) {
	const { data: userData, error: userError } = await getUser(access_token);
	if (userError != null) {
		return { data: userData, error: userError };
	}
	const user = userData.user;
	eventData.user = user.id;
	const { data, error } = await supabase
		.from("events")
		.insert(eventData);
	return { data, error };
}

export async function getEvents(access_token) {
	const { data: userData, error: userError } = await getUser(access_token);
	if (userError != null) {
		return { data: userData, error: userError };
	}
	const user = userData.user;
	const { data, error } = await supabase
		.from("events")
		.select("*")
		.eq("user", user.id);
	return { data, error };
}
