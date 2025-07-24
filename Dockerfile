# Base image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Expose port (update to your app's port)
EXPOSE 3000

# Start the app
CMD ["npm", "start"]