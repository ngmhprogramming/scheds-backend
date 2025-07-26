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

export async function getUserProfileByUsername(username) {
	const { data, error } = await supabase
		.from("profiles")
		.select("*")
		.eq("username", username)
		.single();
	return { data, error };
}

export async function getUserProfile(user_id) {
	const { data, error } = await supabase
		.from("profiles")
		.select("*")
		.eq("user_id", user_id)
		.single();
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

export async function getEventsByUserId(user_id) {
	const { data, error } = await supabase
		.from("events")
		.select("*")
		.eq("user", user_id);
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

export async function createGroup(access_token, groupName) {
	const { data: userData, error: userError } = await getUser(access_token);
	if (userError != null) {
		return { data: userData, error: userError };
	}
	const user = userData.user;
	//create new group
	const { data: groupData, error: groupError } = await supabase
		.from("groups")
		.insert({
			name: groupName,
		})
		.select();

	if (groupError != null) {
		return { data: groupData, error: groupError };
	}
	const groupId = groupData[0].group_id;

	return await supabase
		.from("user-groups")
		.insert({
			group_id: groupId,
			user_id: user.id,
			admin: true,
		});
}

export async function addToGroup(access_token, groupId, username) {
	// retrieve details of user being added
	const { data: addedUserData, error: addedUserError } = await getUserProfileByUsername(username);
	if (addedUserError != null) {
		return { error: addedUserError };
	}
	const addedUser = addedUserData;

	// retrieve details of user adding
	const { data: userData, error: userError } = await getUser(access_token);
	if (userError != null) {
		return { data: userData, error: userError };
	}
	const user = userData.user;

	//check if user has admin access
	const { data: isAdmin, error: adminCheckError } = await supabase.
		from("user-groups")
		.select("admin")
		.eq("user_id", user.id)
		.eq("group_id", groupId)
		.maybeSingle();
	if (adminCheckError != null) {
		return { error: error };
	}
	if (isAdmin == null || isAdmin.admin != true) {
		return { error: "You do not have permission to add users to this group." };
	}

	// add to the group
	return await supabase
		.from("user-groups")
		.upsert({
			group_id: groupId,
			user_id: addedUser.user_id,
		});
}

export async function removeFromGroup(access_token, groupId, userId) {
	const { data: userData, error: userError } = await getUser(access_token);
	if (userError != null) {
		return { data: userData, error: userError };
	}
	const user = userData.user;

	//check if user has admin access
	const { data: isAdmin, error: adminCheckError } = await supabase.
		from("user-groups")
		.select("admin")
		.eq("user_id", user.id)
		.eq("group_id", groupId)
		.maybeSingle();
	if (adminCheckError != null) {
		return { error: error };
	}
	if (isAdmin == null || isAdmin.admin != true) {
		return { error: "You do not have permission to remove users from this group." };
	}

	//remove from the group
	return await supabase
		.from("user-groups")
		.delete()
		.eq("group_id", groupId)
		.eq("user_id", userId);
}

export async function renameGroup(access_token, groupId, groupName) {
	const { data: userData, error: userError } = await getUser(access_token);
	if (userError != null) {
		return { data: userData, error: userError };
	}
	const user = userData.user;
	return await supabase
		.from("groups")
		.update({ name: groupName })
		.eq("group_id", groupId);
}

export async function getGroups(access_token) {
	const { data: userData, error: userError } = await getUser(access_token);
	if (userError != null) {
		return { data: userData, error: userError };
	}

	const user = userData.user;
	//retrieve groups user is a part of
	const { data: userGroups, error: userGroupsError } = await supabase
		.from("user-groups")
		.select("*")
		.eq("user_id", user.id);
	const groupData = await Promise.all(
		userGroups.map(async group => {
			const groupInfo = await getGroupData(group.group_id);
			return groupInfo.data;
		})
	);
	return { data: groupData };
}

export async function getGroupData(group_id) {
	const { data, error } = await supabase
		.from("groups")
		.select("*")
		.eq("group_id", group_id)
		.single();
	return { data, error };
}

export async function getMembers(access_token, groupId) {
	const { data: userData, error: userError } = await getUser(access_token);
	if (userError != null) {
		return { data: userData, error: userError };
	}
	const user = userData.user;

	//check if user is member of the group
	const { data: isMember, error: memberCheckError } = await supabase
		.from("user-groups")
		.select("user_id", { count: 'exact' })
		.eq("group_id", groupId)
		.eq("user_id", user.id);
	if (isMember == 0) {
		return { error: "User is not a member of this group." };
	}

	//retrieve members of a group
	const { data: memberData, error: memberError } = await supabase
		.from("user-groups")
		.select("user_id")
		.eq("group_id", groupId);

	const memberProfileData = await Promise.all(
		memberData.map(async member => {
			const memberInfo = await getUserProfile(member.user_id);
			return memberInfo.data;
		})
	);
	return { data: memberProfileData };
}

export async function updateProfile(access_token, username, full_name, pfp_url, bio) {
	const { data: userData, error: userError } = await getUser(access_token);
	if (userError != null) {
		return { error: "Error getting user" };
	}

	var profileData, profileError;
	
	var { data: profileData, error: profileError } = (username == "") ? { data: profileData, error: profileError } : 
	await supabase
		.from("profiles")
		.update({
			username: username,
		})
		.eq("user_id", userData.user.id);
	
	var { data: profileData, error: profileError } = (full_name == "") ? { data: profileData, error: profileError } : 
	await supabase
		.from("profiles")
		.update({
			full_name: full_name,
		})
		.eq("user_id", userData.user.id);
	
	var { data: profileData, error: profileError } = (pfp_url == "") ? { data: profileData, error: profileError } : 
	await supabase
		.from("profiles")
		.update({
			pfp_url: pfp_url,
		})
		.eq("user_id", userData.user.id);
	
	var { data: profileData, error: profileError } = (bio == "") ? { data: profileData, error: profileError } : 
	await supabase
		.from("profiles")
		.update({
			bio: bio,
		})
		.eq("user_id", userData.user.id);

	if (profileError != null) {
		console.log(profileError);
	}

	return { data: profileData, error: profileError == null ? null : "Error Updating Profile" };
}

export async function updateLogin(access_token, email, password) {
	const { data: userData, error: userError } = await getUser(access_token);
	if (userError != null) {
		return { error: "Error getting user" };
	}

	var loginData, loginError;

	var { data: loginData, error: loginError } = (email == "") ? { data: loginData, error: loginError} : 
	await supabase.auth.updateUser({
		email: email,
	});

	var { data: loginData, error: loginError } = (password == "") ? { data: loginData, error: loginError} : 
	await supabase.auth.updateUser({
		password: password,
	});

	if (loginError != null) {
		console.log(loginError);
	}

	return { data: loginData, error: loginError == null ? null : "Error Updating Login: " + loginError.code };
}