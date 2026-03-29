# Step 1: Build the application
FROM node:20 AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Build the Vite app
RUN npm run build

# Step 2: Serve the app using a lightweight web server
FROM nginx:stable-alpine

# Copy built files from previous stage to Nginx HTML directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config if needed (optional)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]