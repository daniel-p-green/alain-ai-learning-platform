import { Service } from "encore.dev/service";

// CORS for browser calls to tutorials APIs
export default new Service("tutorials", {
  cors: {
    allowOrigins: [process.env.WEB_ORIGIN || "http://localhost:3000"],
    allowMethods: ["GET", "POST"],
    allowHeaders: ["Authorization", "Content-Type"],
  },
});
