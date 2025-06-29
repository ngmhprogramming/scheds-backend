# scheds-backend
This repository contains the code for the backend of scheds

# Deployment
- Clone the GitHub repository
- Initialise `.env` using `env` as a template
- Stop running container
`docker compose down -v`
- Build new container
`docker compose -f docker-compose.yml build --force-rm --no-cache --compress`
- Run a new container from a new image
`docker compose up -d`
- Use at `http://localhost:3000/` (assuming default dockerfile)

# API Testing
We use **Postman** for API testing.
- The Postman Collections can be found in the `/postman` directory
- `scheds-backend` contains requests for each endpoint which can be manually modified for testing
- `scheds-tests` contains requests with dynamically generated data which can be run using Collection Runner