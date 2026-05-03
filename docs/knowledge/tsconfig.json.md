# tsconfig.json

## 1. Purpose
This file configures the TypeScript compiler for the Distributed Job Queue project. It specifies how TypeScript files in `src/` should be transpiled into CommonJS modules in the `dist/` folder.

## 2. Why this approach?
TypeScript was chosen to provide strong typing and clean architecture. We use `target: "ES2022"` to support modern Node.js features, and `strict: true` to enforce strict type checking, reducing runtime errors.

## 3. What if this fails?
If this configuration is missing or incorrect, the TypeScript compilation step (`tsc`) will fail or produce incorrectly formatted JavaScript files, preventing the application from starting. The build step will fail in CI/CD.

## 4. Alternatives considered
- Leaving standard `JS`: Rejected because a production-grade system benefits immensely from type safety, especially for job payloads and database schemas.
- Target `ES6`: Rejected as Node.js LTS supports ES2022 out of the box, offering better performance and native syntax features.

## 5. Internal Flow
- Compiler reads files from `./src`.
- Applies strict type-checking rules.
- Outputs transpiled `.js` files to `./dist`.

## 6. Dependencies
- Depends on `typescript` and `@types/node` packages.

## 7. Rebuild Instructions
1. Run `npx tsc --init`.
2. Update the `compilerOptions` with `rootDir: "./src"`, `outDir: "./dist"`, `target: "ES2022"`, `strict: true`.

## 8. Change Log
- **2026-05-03**: Initialized `tsconfig.json` with strict type checking and output directory mapping.
