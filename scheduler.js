/** 
 * This function takes in an array of users and their currently scheduled events
 * and returns an array of candidate free times they can meet
 * 
 * Inputs:
 * users: [
 * 	{
 * 		username: "username",
 * 		events: [
 * 			{ start: "timestamp", end: "timestamp" }
 * 		]
 * 	}
 * ]
 * searchStart: Earliest start time, timestamp
 * searchEnd: Latest end time, timestamp
 * eventLength: Duration in minutes, int
 * startHour: Earliest Starting Hour, int
 * endHour: Latest End Hour, int
 * stepMinutes: Interval between slots to try, int
 * maxResults: Number of candidate timeslots, int
*/

export function findFreeSlots({
	users,
	searchStart,
	searchEnd,
	eventLength,
	startHourRestriction = 0,
	endHourRestriction = 24,
	stepMinutes = 30,
	maxResults = 10,
}) {
	console.log({
		users,
		searchStart,
		searchEnd,
		eventLength,
		startHourRestriction,
		endHourRestriction,
		stepMinutes,
		maxResults,
	});

	const slots = [];
	const stepMs = stepMinutes * 60 * 1000;
	const durationMs = eventLength * 60 * 1000;

	const searchStartDate = new Date(searchStart);
	const searchEndDate = new Date(searchEnd);
	console.log(searchStartDate, searchEndDate);

	// Try all possible starting times starting from searchStart
	let slotStart = new Date(searchStartDate);

	// Try until slot exceeds end time
	while (slotStart.getTime() + durationMs <= searchEndDate.getTime()) {
		// Calculate endpoints of current slot
		const slotEnd = new Date(slotStart.getTime() + durationMs);

		const startHour = slotStart.getHours();
		const endHour = slotEnd.getHours() + (slotEnd.getMinutes() > 0 ? 1 : 0);

		// Skip if slot outside specified hours
		if (startHour < startHourRestriction || endHour > endHourRestriction) {
			slotStart = new Date(slotStart.getTime() + stepMs);
			continue;
		}

		// Check who is available at this timing
		const availableUsers = users.filter(user => {
			// Check if user events clash
			return user.events.every(event => {
				const eventStart = new Date(event.start).getTime();
				const eventEnd = new Date(event.end).getTime();
				return slotEnd <= eventStart || slotStart >= eventEnd;
			});
		}).map(user => user.username);

		console.log(slotStart, slotEnd, availableUsers);

		// Add to candidate slots if at least one user is free
		if (availableUsers.length > 0) {
			slots.push({
				start: slotStart.toISOString(),
				end: slotEnd.toISOString(),
				numAvailable: availableUsers.length,
				availableUsers: availableUsers,
			});
		}

		// Move to next slot
		slotStart = new Date(slotStart.getTime() + stepMs);
	}

	// Sort descending by number of users available
	slots.sort((a, b) => b.availableUsers - a.availableUsers);

	// Truncate number of results
	return slots.slice(0, maxResults);
}
