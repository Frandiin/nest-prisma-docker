FROM node:20

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm
RUN pnpm install

COPY . .

# 1 - gerar Prisma Client ANTES do build
RUN npx prisma generate

# 2 - build do Nest
RUN pnpm build

CMD ["node", "dist/main.js"]
