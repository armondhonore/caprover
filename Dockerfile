FROM mirror.gcr.io/library/node:22-alpine
RUN apk add --update --no-cache make gcc g++ git curl openssl openssh
WORKDIR /app
COPY . ./
RUN npm ci && npm run build && npm ci --omit=dev && npm cache clean --force
RUN git clone --depth 1 https://github.com/caprover/caprover-frontend.git /tmp/cfe && cd /tmp/cfe && export NODE_OPTIONS=--openssl-legacy-provider && yarn install --no-cache --frozen-lockfile --network-timeout 600000 && yarn run build && mv ./build /app/dist-frontend && cd / && rm -rf /tmp/cfe && yarn cache clean
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV CAPROVER_NEXLAYER_NATIVE=true
ENV IS_CAPTAIN_INSTANCE=1
ENV ACCEPTED_TERMS=true
ENV BY_PASS_PROXY_CHECK=TRUE
ENV MAIN_NODE_IP_ADDRESS=127.0.0.1
EXPOSE 3000
CMD ["node", "built/server.js"]
