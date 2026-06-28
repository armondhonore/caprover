# Nexlayer build/deploy pin for CapRover — DO NOT REGENERATE THE DOCKERFILE

CapRover runs in **Nexlayer-native mode** — no Docker socket, the Nexlayer
platform is the orchestration backend instead of Docker Swarm.

## Build — use the committed root `Dockerfile` AS-IS. Do not regenerate it.
The auto-generated multi-stage Dockerfile is WRONG for CapRover: it copied only
`./built` and the server crashed at boot with
`ENOENT .../template/base-nginx-conf.ejs`. The committed root `Dockerfile`:
- copies the whole repo (so `template/`, `public/`, `views/` ship next to `built/`),
- runs `npm run build`,
- clones + builds the dashboard frontend (`caprover-frontend`) into `dist-frontend`.

Pinned = true. Use the existing `Dockerfile`. Single pod `app`, container port **3000**.

## Required env (in nexlayer.yaml AND baked into the Dockerfile ENV)
- `CAPROVER_NEXLAYER_NATIVE=true` — enables the no-Docker native boot path.
- `IS_CAPTAIN_INSTANCE=1` — skip the Docker-socket installer; serve directly.
- `ACCEPTED_TERMS=true`, `BY_PASS_PROXY_CHECK=TRUE`, `MAIN_NODE_IP_ADDRESS=127.0.0.1`.

The server binds `0.0.0.0:3000`, serves the dashboard at `/` and the API at
`/api/v2/...`. No `/var/run/docker.sock` is required.
