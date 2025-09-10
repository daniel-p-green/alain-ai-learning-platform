export const corsDefaults = {
  allowOrigins: [process.env.WEB_ORIGIN || "http://localhost:3000"],
  allowMethods: ["GET", "POST"],
  allowHeaders: ["Authorization", "Content-Type"],
};

