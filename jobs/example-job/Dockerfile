# Stage 1: Build code
FROM node:lts-alpine as builder
WORKDIR /usr/app
COPY package*.json ./
RUN npm install --development
COPY ./ .
RUN npm run build

# Stage 2: Start app
FROM node:lts-alpine as starter
WORKDIR /usr/app
COPY package.json ./
RUN npm install --production

COPY --from=builder /usr/app/dist ./dist

COPY .env .

# set the NODE_ENV to be used in the API
ENV NODE_ENV=production

EXPOSE 4000
CMD ["node", "dist/main.js"]