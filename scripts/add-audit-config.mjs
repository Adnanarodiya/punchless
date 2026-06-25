import fs from "fs";
import path from "path";

const dir = path.join("apps", "web", "src", "lib", "actions");

function toSnake(name) {
  return name
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "");
}

for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith(".actions.ts") || file === "admin.actions.ts") continue;

  const entity = file.replace(".actions.ts", "");
  const fp = path.join(dir, file);
  let content = fs.readFileSync(fp, "utf8");

  if (content.includes("audit:")) {
    console.log("skip (already has audit):", file);
    continue;
  }

  content = content.replace(
    /export const (\w+) = protectedAction<FormData>\(\{\r?\n  roles: ([^\r\n]+),\r?\n\}\)/g,
    (_match, fn, roles) =>
      `export const ${fn} = protectedAction<FormData>({\r\n  roles: ${roles},\r\n  audit: { action: "${toSnake(fn)}", entityType: "${entity}" },\r\n})`
  );

  fs.writeFileSync(fp, content);
  console.log("patched:", file);
}