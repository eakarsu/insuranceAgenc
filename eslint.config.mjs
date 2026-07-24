import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

function warningsOnly(configs) {
  return configs.map((config) => ({
    ...config,
    rules: Object.fromEntries(
      Object.entries(config.rules ?? {}).map(([rule, setting]) => [
        rule,
        Array.isArray(setting) ? ["warn", ...setting.slice(1)] : "warn",
      ]),
    ),
  }));
}

export default defineConfig([
  ...warningsOnly(nextVitals),
  ...warningsOnly(nextTypeScript),
  globalIgnores([
    ".next/**",
    "coverage/**",
    "node_modules/**",
    "next-env.d.ts",
  ]),
]);
