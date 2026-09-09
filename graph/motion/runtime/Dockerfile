FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends chromium ffmpeg fonts-dejavu-core ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /opt/motion
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts && node -e "for (const p of ['remotion','@remotion/bundler','@remotion/renderer','@remotion/three','three','@react-three/fiber','typescript']) require.resolve(p)"
ENV NODE_PATH=/opt/motion/node_modules HOME=/tmp TMPDIR=/tmp
USER 1000:1000
ENTRYPOINT ["node", "/runtime-worker.cjs"]
