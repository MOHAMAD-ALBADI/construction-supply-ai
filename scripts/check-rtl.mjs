// Fails when physical-direction Tailwind utilities appear in source (Doc 7 §6.3).
// RTL layouts must use logical utilities: ms-/me-/ps-/pe-/start-/end-/text-start/text-end.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(process.cwd(), "src");
const EXTENSIONS = /\.(ts|tsx|css)$/;
// Vendored shadcn primitives: their physical classes are keyed to an explicit `side`
// prop (e.g. Sheet side="right"), which is correct in RTL. Our own code is still checked.
const EXEMPT_DIRS = [join(ROOT, "components", "ui")];

const FORBIDDEN = [
  /(?<![\w-])-?(ml|mr|pl|pr|left|right|border-l|border-r|rounded-l|rounded-r|rounded-tl|rounded-tr|rounded-bl|rounded-br|scroll-ml|scroll-mr|scroll-pl|scroll-pr)-[\w[\].%/-]+/,
  /(?<![\w-])text-(left|right)(?![\w-])/,
  /(?<![\w-])(float|clear)-(left|right)(?![\w-])/,
];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (EXEMPT_DIRS.includes(path)) continue;
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (EXTENSIONS.test(entry) && !entry.endsWith(".test.ts")) yield path;
  }
}

const violations = [];
for (const file of walk(ROOT)) {
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, index) => {
      for (const pattern of FORBIDDEN) {
        const match = line.match(pattern);
        if (match) violations.push(`${relative(process.cwd(), file)}:${index + 1}  ${match[0]}`);
      }
    });
}

if (violations.length > 0) {
  console.error("Physical-direction utilities found (use logical ms-/me-/ps-/pe-/start-/end- instead):");
  for (const violation of violations) console.error(`  ${violation}`);
  process.exit(1);
}
console.log("check:rtl — no physical-direction utilities found.");
