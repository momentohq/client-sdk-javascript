FROM node:16

WORKDIR /loadgen
COPY . .

# Set environment variables
ENV MOMENTO_AUTH_TOKEN='<MOMENTO_AUTH_TOKEN>' \
    BROWSER_CONFIG='{"numberOfBrowserInstances": 1, "numSubscriptions": 2, "publishRatePerSecond": 10}'

RUN npm install

CMD npm run topics-loadgen
