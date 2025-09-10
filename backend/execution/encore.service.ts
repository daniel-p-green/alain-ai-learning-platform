import { Service } from "encore.dev/service";
import { corsDefaults } from "../utils/cors";

// CORS for browser calls. Set WEB_ORIGIN in prod (e.g. https://app.example.com)
export default new Service("execution", { cors: corsDefaults });
