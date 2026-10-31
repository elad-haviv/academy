FROM node:26-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund || npm install --omit=dev --no-audit --no-fund

FROM node:26-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:26-alpine AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    ACADEMY_DATA_DIR=/data

RUN addgroup -S -g 1001 academy && adduser -S -u 1001 -G academy academy \
 && mkdir -p /data && chown -R academy:academy /data

COPY --from=build --chown=academy:academy /app/.next/standalone ./
COPY --from=build --chown=academy:academy /app/.next/static ./.next/static
COPY --from=build --chown=academy:academy /app/public ./public

USER academy
EXPOSE 3000
VOLUME ["/data"]

CMD ["node", "server.js"]
