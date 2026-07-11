const API_URL = process.env.API_URL || "http://localhost:4000";
const SAMPLE_CSV = process.env.SAMPLE_CSV || "../../sample-csvs/facebook-style.csv";
const fs = require("fs");
const path = require("path");

async function run() {
  const checks = [];

  const healthRes = await fetch(`${API_URL}/health`);
  checks.push({
    name: "GET /health",
    pass: healthRes.ok,
    detail: await healthRes.text(),
  });

  const corsRes = await fetch(`${API_URL}/health`, {
    headers: { Origin: "http://localhost:3000" },
  });
  const corsHeader = corsRes.headers.get("access-control-allow-origin");
  checks.push({
    name: "CORS localhost:3000",
    pass: corsHeader === "http://localhost:3000",
    detail: corsHeader || "missing header",
  });

  const csvPath = path.resolve(__dirname, SAMPLE_CSV);
  const csvBuffer = fs.readFileSync(csvPath);
  const form = new FormData();
  form.append(
    "file",
    new Blob([csvBuffer], { type: "text/csv" }),
    path.basename(csvPath)
  );

  const importRes = await fetch(`${API_URL}/api/import`, {
    method: "POST",
    body: form,
  });
  const importBody = await importRes.json();
  const apiKeyMissing =
    !importRes.ok &&
    typeof importBody.error === "string" &&
    importBody.error.includes("OPENAI_API_KEY");

  const importPass =
    (importRes.ok &&
      Array.isArray(importBody.imported) &&
      typeof importBody.stats?.total === "number") ||
    apiKeyMissing;

  checks.push({
    name: "POST /api/import",
    pass: importPass,
    detail: apiKeyMissing
      ? "Skipped: set OPENAI_API_KEY to run full import test"
      : importPass
        ? `${importBody.stats.imported} imported, ${importBody.stats.skipped} skipped`
        : JSON.stringify(importBody),
  });

  console.log("\nSmoke test results:\n");
  for (const check of checks) {
    console.log(`${check.pass ? "PASS" : "FAIL"} - ${check.name}`);
    console.log(`  ${check.detail}\n`);
  }

  const failed = checks.filter((check) => !check.pass).length;
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((error) => {
  console.error("Smoke test crashed:", error.message);
  process.exit(1);
});
