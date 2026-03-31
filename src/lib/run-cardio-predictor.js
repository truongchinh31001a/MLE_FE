import path from "node:path";
import { spawn } from "node:child_process";

const PREDICT_SCRIPT_PATH = path.join(
  process.cwd(),
  "scripts",
  "predict_cardio.py",
);

function runProcess(command, args, payload) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PYTHONUTF8: "1",
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timeoutId = setTimeout(() => {
      if (settled) {
        return;
      }

      settled = true;
      child.kill();
      reject(new Error("The prediction process exceeded the allowed time limit."));
    }, 30000);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeoutId);
      reject(error);
    });

    child.on("close", (code) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeoutId);

      if (code !== 0) {
        reject(
          new Error(
            stderr.trim() || `Python predictor exited with code ${code}.`,
          ),
        );
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(
          new Error(
            `Unable to parse JSON returned by the predictor. ${error.message}`,
          ),
        );
      }
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}

export async function runCardioPredictor(payload) {
  const candidates = [
    { command: "python", args: [PREDICT_SCRIPT_PATH] },
    { command: "py", args: ["-3", PREDICT_SCRIPT_PATH] },
  ];

  let lastError = null;

  for (const candidate of candidates) {
    try {
      return await runProcess(candidate.command, candidate.args, payload);
    } catch (error) {
      lastError = error;

      if (error.code && error.code !== "ENOENT") {
        break;
      }
    }
  }

  throw lastError ?? new Error("No Python runtime was found to run the model.");
}
