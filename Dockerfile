# Stage 1: Build code
FROM node:lts-alpine as builder
WORKDIR /usr/app
ARG NPM_TOKEN  
COPY package*.json ./
COPY .npmrc .npmrc
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Start app
FROM node:lts-alpine as starter
WORKDIR /usr/app
ARG NPM_TOKEN  
COPY package.json ./
COPY .npmrc .npmrc
RUN npm install --production

# Install PM2
RUN npm install pm2 -g

COPY --from=builder /usr/app/dist ./dist

# set the NODE_ENV to be used in the API
ENV NODE_ENV=production

EXPOSE 4000
CMD ["pm2-runtime", "dist/main.js"]
# CMD node dist/main
