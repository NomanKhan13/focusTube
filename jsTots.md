1. Converted ApiError.js to ApiError.ts with proper TypeScript typings for statusCode and success properties.
2. added globalErrorHandler middleware to handle errors, where I learned about adding AppError type for errors.
3. Made a seperate folder for config and moved db.ts and config.ts there.
4. Moved db connection to config/db.ts and imported it in index.ts to keep index.ts clean.

feat: migrate project to TypeScript, refactor app structure

- Changed main entry point from index.js to index.ts in package.json
- Removed JavaScript files (app.js, index.js, db.js, errorHandler.js, ApiError.js) and replaced them with TypeScript counterparts
- Created new config folder and moved database connection logic to config/db.ts
- Implemented global error handler middleware with TypeScript typings
- Updated ESLint configuration to support TypeScript
- Added TypeScript configuration file (tsconfig.json) for project settings
- Updated nodemon configuration to watch TypeScript files
- Refactored app setup to use TypeScript and improved error handling
