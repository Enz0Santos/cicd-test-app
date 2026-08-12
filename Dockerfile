# Pinned by digest, not by tag: `node:20-alpine` is repointed on every patch release, and an unpinned base means the image CI tested and the image the registry received can be built from different bytes. Dependabot's `docker` ecosystem bumps the digest and the comment together.
FROM node:26-alpine@sha256:aadf416b2cdce311a8811ba3f0608a61b77dbf997500e2eafe781b51f6a0b019

# Many managed platforms (Coolify, etc.) run HTTP healthchecks with `curl` inside the container. Alpine's busybox wget alone isn't enough for those.
RUN apk add --no-cache curl

WORKDIR /app

# `npm ci` installs exactly what the lockfile records, and --ignore-scripts keeps a dependency's preinstall/postinstall hooks from executing during the build. Those hooks are arbitrary code running as root in your pipeline.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund

COPY src ./src

# The deploy platform may run the container as root or as a numeric UID that isn't `node`. Make the tree readable/traversable by any user so Node can always load /app/src/index.js (avoids EACCES crash loops on some hosts).
RUN chmod -R a+rX /app

ENV PORT=3000 \
    NODE_ENV=production

EXPOSE 3000

# Intentionally no USER directive: the deploy platform may inject its own runtime user. App code is world-readable above, so any UID works.

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/health || exit 1

CMD ["node", "src/index.js"]
