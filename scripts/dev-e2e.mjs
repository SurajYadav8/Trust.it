import { spawn } from "node:child_process";

const child = spawn("npx", ["next", "dev", "-p", "3000"], {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    NEXT_PUBLIC_E2E_MODE: "true",
  },
});

child.on("exit", (code) => process.exit(code ?? 0));
