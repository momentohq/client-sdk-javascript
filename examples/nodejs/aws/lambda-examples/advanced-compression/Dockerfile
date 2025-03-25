FROM amazonlinux:2023

# Install build dependencies
RUN yum install -y zip && \
  curl -fsSL https://rpm.nodesource.com/setup_20.x | bash - && \
  yum install -y nodejs && \
  npm install -g node-gyp

WORKDIR /app

COPY package.json package-lock.json tsconfig.json esbuild.ts postbuild.ts ./
COPY src ./src

RUN npm install --platform=linux --arch=x64
RUN npm run build

CMD ["cp", "function.zip", "/output/"]
