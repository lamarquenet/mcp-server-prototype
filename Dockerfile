FROM node:23-alpine

WORKDIR /app

# Copy package files
COPY package*.json tsconfig.json ./

# Copy source so that tsconfig's include paths exist
COPY . .

# Install dependencies
RUN npm install

# Build the application
RUN npm run build

# Switch to non-root user
USER node

# Start the server
CMD ["node", "build/index.js"]