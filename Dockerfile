FROM node:20

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install

COPY . .

# build do nest
RUN pnpm build

# prisma client
RUN npx prisma generate

CMD ["node", "dist/main.js"]
