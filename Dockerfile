FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build --if-present || npx vite build

FROM scratch AS export
COPY --from=builder /app/build /
