FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

ARG token
ENV MOMENTO_AUTH_TOKEN $token
ARG cache
ENV MOMENTO_CACHE_NAME $cache

# Install app dependencies
COPY . .

RUN npm install

CMD [ "npm", "run", "basic" ]