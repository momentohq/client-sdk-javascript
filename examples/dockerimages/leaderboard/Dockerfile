# Use an official Node runtime as a parent image
FROM node:18

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install any dependencies
RUN npm install

# Bundle your app's source code inside the Docker image
COPY . .

# Your application's default command
CMD [ "npm", "run", "leaderboard" ]
