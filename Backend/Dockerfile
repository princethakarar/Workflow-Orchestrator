# Use a lightweight Node.js base image
FROM node:20-bullseye-slim

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first (for efficient caching)
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of your backend code
COPY . .

# Expose the port your Express server uses
EXPOSE 5000

# Command to start your server
CMD ["npm", "start"]