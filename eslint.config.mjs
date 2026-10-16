import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Layer boundaries (Doc 7 §3). Patterns are globs so they also catch relative imports.
const ADMIN_CLIENT = {
  group: ["**/server/db/admin", "**/server/db/admin.ts"],
  message: "The admin (secret-key) client may only be used by server/workflow, server/services and scripts.",
};
const AGENTS = {
  group: ["**/server/agents", "**/server/agents/**"],
  message: "Agents are invoked only by the workflow controller.",
};
const WORKFLOW = { group: ["**/server/workflow", "**/server/workflow/**"], message: "Not allowed from this layer." };
const SERVICES = { group: ["**/server/services", "**/server/services/**"], message: "Not allowed from this layer." };
const ANY_SERVER = { group: ["**/server", "**/server/**"], message: "Client-safe code must not import server modules." };

const restrict = (...patterns) => ({ "no-restricted-imports": ["error", { patterns }] });

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/domain/**/*.{ts,tsx}"],
    rules: restrict(
      ANY_SERVER,
      { group: ["**/app/**", "**/components/**", "next", "next/*", "react", "react-dom"], message: "src/domain must stay pure." },
      { group: ["@supabase/*", "openai", "openai/*"], message: "src/domain must not do IO." },
    ),
  },
  { files: ["src/server/agents/**/*.{ts,tsx}"], rules: restrict(ADMIN_CLIENT, WORKFLOW, SERVICES) },
  { files: ["src/server/services/**/*.{ts,tsx}"], rules: restrict(AGENTS, WORKFLOW) },
  { files: ["src/app/**/*.{ts,tsx}"], rules: restrict(ADMIN_CLIENT, AGENTS) },
  { files: ["src/components/**/*.{ts,tsx}", "src/lib/**/*.{ts,tsx}"], rules: restrict(ANY_SERVER) },
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts"]),
]);

export default eslintConfig;
