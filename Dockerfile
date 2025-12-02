# Dockerfile.dev
FROM node:20

RUN corepack enable

WORKDIR /app

# Instala dependências
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# O restante do código será montado pelo volume
CMD ["pnpm", "start:dev"]
