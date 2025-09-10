import { Service } from "encore.dev/service";
import { corsDefaults } from "../utils/cors";
// CORS for browser calls to assessments APIs
export default new Service("assessments", { cors: corsDefaults });
