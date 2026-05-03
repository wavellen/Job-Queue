# Dockerfile

## 1. Purpose
Provides the containerization blueprint for deploying the system to cloud platforms like Railway, Render, or AWS ECS. It packages the Node.js application, its dependencies, and the compiled TypeScript code into a single, deployable image.

## 2. Why this approach?
We use a **Multi-Stage Build**:
1. **Builder Stage:** Installs all dependencies (including `devDependencies` like TypeScript) and compiles the `.ts` files into `./dist`.
2. **Production Stage:** Copies only the compiled `./dist` folder and installs only `dependencies` (excluding heavy dev tools). 
This results in a much smaller, more secure, and faster-booting production image.

## 3. What if this fails?
If the Dockerfile is malformed, CI/CD pipelines will fail during the build step. If the build succeeds but the image crashes on start, it usually means environment variables (like `DATABASE_URL` or `REDIS_HOST`) were not provided by the hosting platform at runtime.

## 4. Alternatives considered
- Single-stage build: Rejected because it leaves the TypeScript compiler and all its dependencies in the production image, increasing size and attack surface.
- PM2 without Docker: Rejected. The spec explicitly requires "Containerize application" for modern cloud deployment.

## 5. Internal Flow
- Base `node:20-alpine` -> Install deps -> `npm run build` -> New clean stage -> Install prod deps -> Copy `dist` -> `EXPOSE 3000` -> `CMD ["npm", "start"]`.

## 6. Dependencies
- Node 20 Alpine Linux base image.
- `package.json` scripts (`build`, `start`, `start:worker`).

## 7. Rebuild Instructions
1. Run `docker build -t job-queue .`
2. Ensure `.dockerignore` excludes `node_modules` and `dist` from the context.

## 8. Change Log
- **2026-05-03**: Created optimized multi-stage Dockerfile.
