FROM --platform=linux/amd64 public.ecr.aws/docker/library/node:18

WORKDIR /usr/src/app

COPY ecs-code/index.ts ./
COPY ecs-code/package.json ./
RUN npm install

ENV MOMENTO_API_KEY_SECRET_NAME="MomentoMetricsApiKey"
CMD ["npm", "run", "start"]

