# Dockerfile.dev
FROM node:20

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install

COPY . .

# GERA O PRISMA CLIENT AQUI
RUN npx prisma generate

CMD ["pnpm", "start:dev"]