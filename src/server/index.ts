import app from "./app";
import { CONFIG } from "../core/config";

app.listen(CONFIG.SERVER_PORT, () => {
  console.log(`Contest Copilot running on port ${CONFIG.SERVER_PORT}`);
});