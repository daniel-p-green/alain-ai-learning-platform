import { Service } from "encore.dev/service";

export default new Service("progress", {
  cors: {
    allowOrigins: [process.env.WEB_ORIGIN || "http://localhost:3000"],
    allowMethods: ["GET", "POST"],
    allowHeaders: ["Authorization", "Content-Type"],
  },
});
