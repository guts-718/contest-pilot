import app from "./app";
import { CONFIG } from "../core/config";
import { logger } from "../core/logger";
import { jobQueue } from "../core/jobQueue";

// jobQueue.add(async () => {
//   console.log("Job ran");
//   return 1;
// });

app.listen(CONFIG.SERVER_PORT, () => {
  logger.info("server", `Running on port ${CONFIG.SERVER_PORT}`);
});