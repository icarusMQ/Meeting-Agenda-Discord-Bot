# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the app
COPY . .

# Expose no ports (Discord bots don't need incoming ports)

# Start the bot
CMD ["node", "src/index.js"]
