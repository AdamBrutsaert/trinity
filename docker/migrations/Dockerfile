FROM oven/bun AS build

WORKDIR /app

COPY package.json package.json
COPY bun.lock bun.lock
COPY apps/api/package.json ./apps/api/package.json

RUN bun install

COPY apps/api ./apps/api

ENV NODE_ENV=production

CMD ["sh", "-c", "cd apps/api && bun run migrate"]
