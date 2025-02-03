FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

# Copy environment file first
COPY .env.production .env

# Then copy the rest of the application
COPY . .

ENV NODE_ENV=production

# Build the application
RUN npm run build

# Install serve to run the built application
RUN npm install -g serve

EXPOSE 5173

# Serve the built application
CMD ["serve", "-s", "dist", "-l", "5173"]
