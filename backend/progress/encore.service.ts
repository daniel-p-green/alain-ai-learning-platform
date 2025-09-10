import { Service } from "encore.dev/service";
import { corsDefaults } from "../utils/cors";

export default new Service("progress", { cors: corsDefaults });
