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

EXPOSE 5173

# Use Vite's preview command to serve the built files
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
