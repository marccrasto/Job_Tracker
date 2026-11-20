# Frontend and backend are one container. The frontend is plain HTML, CSS, and JavaScript files in public/, and Express already serves them (that’s the express.static line in src/app.js). So when the Node app runs, it serves both the API and the web page. One image covers both.
# Separate frontend images are common when the frontend has its own build step and server, like a React or Next.js app served by Nginx.

# Lightweight (200 MB) with the tools I need
FROM node:22-bookworm-slim

# Express and many libraries switch off debug behaviour and run faster when this is set (if debugger should stay on, switch to 'development')
ENV NODE_ENV=production

# Current working directory inside the container. Make sure to include the starting slash so it stays absolute path as linters expect this
WORKDIR /usr/src/app

# This will copy all the package.json files into the current working directory of the container (usr/src/app)
# One rule about Docker’s cache: when a layer changes, every layer after it is rebuilt too, not just that one layer.
# So in this case, we copied package.json files and running npm ci first. This is because they are expensive steps and it's better to have them cached as they will most likely change the least
# Caching pays off with expensive steps, and in this project that’s npm ci, which downloads and installs every package. That’s the one you want to protect: copy package.json and package-lock.json, then run npm ci, then copy code
# The general rule is: things that change least go first.

COPY package*.json ./
RUN npm ci --omit=dev

# Now we copy our everything (our code) from build context to current working directory
# While this does copy package.json and package-lock.json a second time, since the second copy is identical to the first, the files just get overwritten with the same content. npm ci already ran in an earlier layer and doesn’t run again. And since COPY . . comes after npm ci, changing your code only rebuilds that last copy layer. The cached install stays untouched.
# The first copy isn’t about getting the files into the image. It’s about giving npm ci its own layer that only depends on those two files, so Docker knows it can reuse the install whenever they haven’t changed
# However, COPY . . would also copy your WSL node_modules folder over the one npm ci just built in the container. That folder includes dev tools you don’t want in the image, and it was built for your machine, not the container. This is the main reason node_modules goes in .dockerignore
# The alternative is to skip COPY . . and copy only what the app needs to run: src, public, db. That leaves tests/, eslint.config.js, Taskfile.yaml, and devbox.json out of the image automatically, so the production image is leaner and more deliberate. With COPY . ., .dockerignore has to do that filtering instead.
# Both approaches are valid. Many teams prefer copying explicitly for production images, because nothing sneaks in unexpectedly. In this case, we will use COPY . . and create a .dockerignore
COPY . .

# EXPOSE is informational only; it does not actually publish or expose the port or open it to the host. Exposing the port is done when using docker run. 
# This is still useful for tools that autogenerate configurations (Docker Compose, Swarm, K8s (Kubernetes))
EXPOSE 3000

# By default containers run as root. If someone exploits app, they'd have root access inside container
# The official Node images include a ready-made unprivileged user called node. The app only reads its files, so nothing else needs to change.
USER node

# For the CMD line, you want the equivalent of npm start, not npm run dev. npm run dev is only meant for the host because it looks for the restarting app if code changes (which doesn't happen inside container) and for the .env file which is not in the container
# In a container, settings come from environment variables you pass in when it runs.
CMD ["node", "src/server.js"]