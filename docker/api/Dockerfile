FROM oven/bun AS build

WORKDIR /app

COPY package.json package.json
COPY bun.lock bun.lock
COPY apps/api/package.json ./apps/api/package.json

RUN bun install

COPY apps/api ./apps/api

ENV NODE_ENV=production

RUN bun build \
    --compile \
    --minify-whitespace \
    --minify-syntax \
    --outfile server \
    apps/api/src/index.ts

FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=build /app/server server

ENV NODE_ENV=production
ENV PORT=3000

CMD ["./server"]

EXPOSE 3000
