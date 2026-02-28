import os from "os";
import path from "path"

export const CONFIG = {
  SERVER_PORT: 5000,

  DEFAULT_LIMITS: {
    TIME_MS: 2000,
    MEMORY_MB: 256
  },

  EXECUTION: {
    TMP_DIR: path.join(os.tmpdir(), "contest-copilot")
  },

  DOCKER: {
    CPP_IMAGE: "copilot-cpp",
    PY_IMAGE: "copilot-python"
  }
};