# Nexlayer build/deploy pin for CapRover

CapRover runs in **Nexlayer-native mode** — no Docker socket, the Nexlayer
platform is the orchestration backend instead of Docker Swarm.

## Build
- Build from source using the existing repo Dockerfile **`dockerfile-captain.release`**.
- Do NOT regenerate or replace the Dockerfile. It compiles the TypeScript
  backend (`npm run build`) and clones+builds the CapRover dashboard frontend
  (`caprover-frontend`) into `dist-frontend`.
- Single pod named `app`, container port **3000**.

## Required env (already in nexlayer.yaml — keep them)
- `CAPROVER_NEXLAYER_NATIVE=true` — enables the no-Docker native boot path.
- `IS_CAPTAIN_INSTANCE=1` — skip the Docker-socket installer; serve directly.
- `ACCEPTED_TERMS=true`, `BY_PASS_PROXY_CHECK=TRUE`, `MAIN_NODE_IP_ADDRESS=127.0.0.1`.

The server binds `0.0.0.0:3000` and serves the dashboard at `/` plus the API at
`/api/v2/...`. No `/var/run/docker.sock` is required.
