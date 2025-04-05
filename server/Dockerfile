FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy server files
COPY . .

# Create directory for images if it doesn't exist
RUN mkdir -p ./public/images

# Expose the port the app runs on
EXPOSE 8080

# Command to run the application
CMD ["node", "server.js"]