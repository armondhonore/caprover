# Nexlayer — caprover

<!-- nexlayer:meta version=1 analyzed=2026-06-28T14:21:00Z repo=https://github.com/armondHonore/caprover branch=nexlayer -->

> **For AI agents (Claude Code, Cursor, Gemini CLI, Copilot):**
> This file is the **project context** for this Nexlayer deployment — tech stack, env vars, secrets, live URL.
> For full platform detail (nexlayer.yaml schema, Dockerfile rules, CI/CD, task recipes) read **`nexlayer.skills`** in this repo.
>
> **Critical rules (full detail in `nexlayer.skills`):**
> - Inter-pod refs: `${podName:port}` only — never `localhost` or bare hostnames
> - Docker Hub images: prefix with `mirror.gcr.io/library/` — bare tags fail on the cluster
> - Secrets: set in the Nexlayer dashboard — never commit to `nexlayer.yaml` or Dockerfile
>
> **This file:** `agent-managed` sections update automatically. `user-editable` sections (Local Development Setup, Nexlayer Deployment Plan, Build Notes) are yours — preserved across re-analysis.

## Project Summary
<!-- nexlayer:section agent-managed=project_summary -->
CapRover is an application and database deployment platform that provides a Web GUI and CLI to manage Docker containers, Nginx load balancing, and Let's Encrypt SSL certificates.
<!-- nexlayer:end -->

## Technology Stack
<!-- nexlayer:section agent-managed=tech_stack -->
| Name | Kind | Version | Detected From |
|------|------|---------|---------------|
| TypeScript | language | ^5.8.3 | package.json |
| Node.js | language | 22-alpine | dockerfile-captain.release |
| Express | framework | ^5.1.0 | package.json |
| Docker | infra | latest | README.md |
| Nginx | infra | latest | README.md |
<!-- nexlayer:end -->

## Repository Structure
<!-- nexlayer:section agent-managed=structure_map -->
- src/ — Core application logic and TypeScript source
- public/ — Static assets for the Web GUI
- template/ — Nginx and configuration templates
- built/ — Compiled JavaScript output
- dev-scripts/ — Shell scripts for local environment reset and cleanup
<!-- nexlayer:end -->

## External Services Required
<!-- nexlayer:section agent-managed=external_deps -->
Services that must be configured separately (not deployed by Nexlayer):

- Docker Engine API
- Let's Encrypt API
- GitHub API (via simple-git)
<!-- nexlayer:end -->

## Local Development Setup
<!-- nexlayer:section user-editable=local_setup -->
### Prerequisites

- Node.js >= 20
- npm
- Docker

### Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
NODE_ENV=development
CAPROVER_PORT=3000
```

### Steps

1. `npm install` — Install project dependencies
2. `npm run build` — Compile TypeScript to JavaScript
3. `npm run dev` — Run development environment scripts

<!-- nexlayer:end -->

## Nexlayer Setup
<!-- nexlayer:section agent-managed=nexlayer_setup -->
### Pod Environment Variables

| Pod | Variable | Value | Kind |
|-----|----------|-------|------|
| `app` | `NODE_ENV` | `"production"` | plain |
| `app` | `PORT` | `"3000"` | plain |
| `app` | `HOSTNAME` | `"0.0.0.0"` | plain |

### nexlayer.yaml

```yaml
application:
  name: caprover
  pods:
    - name: app
      image: "registry.nexlayer.io/user_01kece1xyh817dwff7wnarhkxd/caprover:19f0e9a95fe"
      path: /
      servicePorts:
        - 3000
      vars:
        NODE_ENV: "production"
        PORT: "3000"
        HOSTNAME: "0.0.0.0"
```

<!-- nexlayer:end -->

## Nexlayer Deployment Plan
<!-- nexlayer:section user-editable=deployment_plan -->
### Pod Topology

| Pod | Image | Port | Role |
|-----|-------|------|------|
| captain | mirror.gcr.io/library/node:22-alpine | 3000 | web |

### Deployment notes

- The captain pod requires access to the host Docker socket to manage other containers.
- Since this is a management platform, it orchestrates other pods; internal communications for managed apps must follow the <podName>.pod:<port> pattern.

<!-- nexlayer:end -->

## Build Notes
<!-- nexlayer:section user-editable=build_notes -->
<!-- Add notes for future builds here — preserved across re-analysis -->
<!-- nexlayer:end -->

## Nexlayer Configuration
<!-- nexlayer:section agent-managed=nexlayer_config -->
**Last deployed:** 2026-06-28T14:27:26Z  
**Live URL:** https://relaxed-weasel-caprover.cloud.nexlayer.ai  
**Runtime:**  · **Port:** auto-detected  
**Deploy branch:** nexlayer  

```yaml
application:
  name: caprover
  pods:
    - name: app
      image: "registry.nexlayer.io/user_01kece1xyh817dwff7wnarhkxd/caprover:19f0e9a95fe"
      path: /
      servicePorts:
        - 3000
      vars:
        NODE_ENV: "production"
        PORT: "3000"
        HOSTNAME: "0.0.0.0"
```
<!-- nexlayer:end -->

## Build History
<!-- nexlayer:section agent-managed=build_history -->
| Date | Status | Notes |
|------|--------|-------|
| 2026-06-28T14:21:00Z | analyzed | initial repo analysis |
| 2026-06-28T14:27:26Z | success | deployed https://relaxed-weasel-caprover.cloud.nexlayer.ai |
<!-- nexlayer:end -->
