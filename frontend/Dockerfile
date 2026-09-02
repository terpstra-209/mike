# Build context is the REPO ROOT (see docker-compose.yml): the frontend
# type-imports from backend/src (e.g. shared/types.ts pulls AskInputsEvent
# from backend/src/lib/chat/types), so a frontend-only context makes those
# unions silently collapse and `next build`'s type check fails. Only the
# backend's *sources* are copied — nothing from backend lands in the bundle;
# the imports are `import type` and erased at compile time.
FROM node:22-slim

WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
COPY backend/src /backend/src

# src/wordAddin/*.test.ts are cross-package drift guards that import the Word
# add-in's source directly (see that directory's own header comments) to
# catch its hand-mirrored model catalog drifting from the web app's. That
# only resolves when word-addin/ is a real sibling directory, which isn't
# true inside this image's build context — Docker Desktop's file sharing
# excludes it here even with a repo-root .dockerignore that doesn't. Skip
# just those files for this build; they still fully type-check in normal
# dev and CI, where word-addin/ is a real sibling directory.
RUN node -e "const fs=require('fs');const c=JSON.parse(fs.readFileSync('tsconfig.json','utf8'));c.exclude=[...(c.exclude||[]),'src/wordAddin/**'];fs.writeFileSync('tsconfig.json',JSON.stringify(c,null,2));"
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
