ARG BUN_VERSION
FROM oven/bun:${BUN_VERSION} AS builder

WORKDIR /app

# Install git to embed commit hash at build time
RUN apt-get update && apt-get install -y --no-install-recommends \
    git=1:2.39.5-0+deb12u2 \
    && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY .git ./.git
COPY . .

RUN bun run build

FROM oven/bun:${BUN_VERSION}-slim

WORKDIR /app

COPY package.json bun.lock ./

COPY --from=builder /app/dist ./dist

EXPOSE 3000

WORKDIR /app/dist

CMD ["bun", "index.js"]
