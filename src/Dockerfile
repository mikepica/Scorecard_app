FROM harbor.csis.astrazeneca.net/azimuth-images/node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./
COPY package-lock*.json ./
COPY public /app/public
COPY app /app/app
COPY styles /app/styles
COPY components /app/components

# Install the project dependencies
RUN npm install

# Install Python 3 and pip
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv

# Copy requirements.txt and install Python dependencies
COPY requirements.txt ./
RUN python3 -m venv venv && \
    /bin/bash -c "source venv/bin/activate && pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.txt"

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Expose the port your app runs on (adjust if necessary)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]