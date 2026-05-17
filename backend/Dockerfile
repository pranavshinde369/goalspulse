FROM node:18-slim

# Install OpenSSL (required by Prisma Client)
RUN apt-get update -y && apt-get install -y openssl ca-certificates

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 8080

CMD ["node", "src/server.js"]
