# Use the official Node.js image as the base image
FROM node:20

# Set the working directory
WORKDIR /app

# We don't need the standalone Chromium
#ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Install Google Chrome Stable and fonts
# Note: this installs the necessary libs to make the browser work with Puppeteer.
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*



# Copy package.json and package-lock.json
COPY package*.json ./

RUN npm i puppeteer

RUN npm install


COPY . .

# Expose the port on which your app will run
EXPOSE 8000
# Start your Node.js application
CMD ["node", "server.js"]