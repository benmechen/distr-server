# Stage 1: Build code
FROM node:lts-gallium as builder
WORKDIR /usr/app
ARG NPM_TOKEN  
COPY package*.json ./
COPY .npmrc .npmrc
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Start app
FROM node:lts-gallium as starter
WORKDIR /usr/app
ARG NPM_TOKEN  
COPY package.json ./
COPY .npmrc .npmrc
RUN npm install --production --legacy-peer-deps

COPY --from=builder /usr/app/dist ./dist

# set the NODE_ENV to be used in the API
ENV NODE_ENV=production

EXPOSE 4000
CMD ["node", "dist/src/main.js"]
# CMD node dist/main
