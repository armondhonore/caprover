# CapRover — Nexlayer-native build (no Docker socket required at runtime).
#
# This MUST build the full CapRover server, not just built/server.js:
#   - the TypeScript backend (npm run build -> ./built)
#   - the runtime asset dirs the server reads relative to ./built:
#       template/ (base-nginx-conf.ejs etc.), public/, views/
#   - the dashboard frontend (separate repo) -> ./dist-frontend, served at "/"
#
# A previous auto-generated multi-stage Dockerfile copied only ./built and
# crashed at boot on ENOENT .../template/base-nginx-conf.ejs. Keep this single
# stage so the asset dirs ship alongside ./built.
FROM mirror.gcr.io/library/node:22-alpine
RUN apk add --update --no-cache make gcc g++ git curl openssl openssh

WORKDIR /app
COPY . ./

# Build backend (TypeScript -> ./built)
RUN npm ci && \
     npm run build && \
     npm ci --omit=dev && \
     npm cache clean --force

# Build the CapRover dashboard frontend (separate repo upstream) into
# ./dist-frontend so the dashboard is served at "/".
RUN git clone --depth 1 https://github.com/caprover/caprover-frontend.git /tmp/caprover-frontend && \
     cd /tmp/caprover-frontend && \
     export NODE_OPTIONS=--openssl-legacy-provider && \
     yarn install --no-cache --frozen-lockfile --network-timeout 600000 && \
     yarn run build && \
     mv ./build /app/dist-frontend && \
     cd / && \
     rm -rf /tmp/caprover-frontend && \
     yarn cache clean

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Nexlayer-native: no Docker/Swarm; serve the dashboard directly.
ENV CAPROVER_NEXLAYER_NATIVE=true
ENV IS_CAPTAIN_INSTANCE=1
ENV ACCEPTED_TERMS=true
ENV BY_PASS_PROXY_CHECK=TRUE
ENV MAIN_NODE_IP_ADDRESS=127.0.0.1
EXPOSE 3000

CMD ["node", "built/server.js"]
