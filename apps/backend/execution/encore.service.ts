import { Service } from "encore.dev/service";
// Initialize global observability (error handlers, etc.) once per service
import "../utils/init-observability";

// Service declaration (no extra fields; Encore JS doesn't accept CORS here)
export default new Service("execution");
