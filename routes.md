# scheds API Routes

**Base URL:** `http://<your-backend-domain>:<port>` (default port is 3000)
**Frontend Origin:** `FRONTEND_URL` in `.env`

_All routes support CORS and send / receive cookies for session management._

---

## Authentication

### `POST /signup`

Registers a new user and sets an authentication cookie containing JWT information.

#### Request (Form Data)
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

#### Sample Response
✅ `200 OK`
```json
{
    "data": {
        "user_id": "301835a4-e164-43cc-baca-073970815057",
        "created_at": "2025-06-28T15:22:03.804418+00:00",
        "username": "username",
        "pfp_url": "https://i.pravatar.cc/300",
        "bio": "A scheds user",
        "full_name": "Unknown"
    }
}
```

❌ `200 OK`
```json
{ "error": "No email specified!" }
```

---

### `POST /login`

Logs in an existing user using email and password. Also sets authentication cookie on success.

#### Request (Form Data)
```json
{
  "email": "string",
  "password": "string"
}
```

#### Sample Response
✅ `200 OK`
```json
{
    "data": {
        "user_id": "23f935cd-3bbb-4d37-b2c0-050cc0297b0e",
        "created_at": "2025-06-28T09:16:29.251879+00:00",
        "username": "username",
        "pfp_url": "https://i.pravatar.cc/300",
        "bio": "A scheds user",
        "full_name": "Unknown"
    }
}
```

❌ `200 OK`
```json
{
    "error": "Invalid login credentials."
}
```

---

### `POST /logout`

Logs out the current user by clearing the authentication cookie.

#### Sample Response
✅ `200 OK`
```json
{
    "data": "Successfully logged out!"
}
```

---

## Event Scheduling

### `POST /schedule/create-event`

Creates a calendar event for an authenticated user.

#### Auth
Requires valid session via `token` cookie.

#### Request (Form Data)
```json
{
  "title": "Meeting",
  "start": "2025-06-28T14:08:35.558Z",
  "end": "2025-06-28T14:09:35.558Z",
  "description": "Optional Description"
}
```

#### Sample Response
✅ `200 OK`
```json
{
    "data": "Success"
}
```

❌ `200 OK`
```json
{
	"error": "User not logged in!"
}
```

---

### `GET /schedule/events`

Fetches all events created by the logged-in user.

#### Auth
Requires valid session via `token` cookie.

#### Sample Response
✅ `200 OK`
```json
{
	"data": [
		{
			"id": 1,
			"created_at": "2025-06-28T09:30:59.515874+00:00",
			"user": "315fc599-bbd3-4b07-a221-8068ef546429",
			"title": "Event Title",
			"start": "2025-06-01T00:56:00+00:00",
			"end": "2025-06-01T12:56:00+00:00",
			"description": "Event Description"
		}
	]
}
```

❌ `200 OK`
```json
{ "error": "User not logged in!" }
```

---

## 🛠 Other

### `GET /`

Redirects to the hosted frontend.

#### Response
302 Redirect to: `https://scheds.ngmunhin.com/`

---

## Notes

- All `POST` endpoints use `multipart/form-data` via `multer`.
- Cookies are set with `httpOnly`, `secure`, and `sameSite` policies depending on whether `SERVER_ENV` is set to `prod`.
- Error responses are simple strings.
- Currently, all error responses will give 200 OK instead of appropriate status codes.