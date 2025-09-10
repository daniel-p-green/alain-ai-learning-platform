import { Service } from "encore.dev/service";

// CORS for browser calls. Set WEB_ORIGIN in prod (e.g. https://app.example.com)
export default new Service("execution", {
  cors: {
    allowOrigins: [process.env.WEB_ORIGIN || "http://localhost:3000"],
    allowMethods: ["GET", "POST"],
    allowHeaders: ["Authorization", "Content-Type"],
  },
});
