import { Service } from "encore.dev/service";
import { corsDefaults } from "../utils/cors";

// CORS for browser calls to tutorials APIs
export default new Service("tutorials", { cors: corsDefaults });
