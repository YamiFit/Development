/*
  Diagnostic script: reproduces the PostgREST 42703 error locally
  without printing any Supabase keys.

  Usage (from Client/):
    node scripts/diag-postgrest.cjs
*/

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const readEnvFile = (filePath) => {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
};

const getEnvVarFromText = (text, name) => {
  const re = new RegExp(`^${name}\\s*=\\s*\"?([^\"\\r\\n]*)\"?`, "m");
  const match = text.match(re);
  return match ? match[1] : null;
};

const main = async () => {
  const serverEnvPath = path.resolve(__dirname, "..", "..", "Server", ".env");
  const clientEnvPath = path.resolve(__dirname, "..", ".env");

  const envText = [readEnvFile(serverEnvPath), readEnvFile(clientEnvPath)].join("\n");

  const url =
    getEnvVarFromText(envText, "VITE_SUPABASE_URL") ||
    getEnvVarFromText(envText, "SUPABASE_URL");

  const key =
    getEnvVarFromText(envText, "VITE_SUPABASE_ANON_KEY") ||
    getEnvVarFromText(envText, "SUPABASE_ANON_KEY") ||
    getEnvVarFromText(envText, "SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !key) {
    console.error("Missing SUPABASE_URL/VITE_SUPABASE_URL or anon/service key in env files.");
    process.exitCode = 1;
    return;
  }

  const supabase = createClient(url, key);

  const selectList =
    "id,business_name,provider_name,profile_image_url,address,phone,email,whatsapp,is_active,is_verified";

  const { data, error } = await supabase
    .from("meal_providers")
    .select(selectList)
    .order("business_name", { ascending: true });

  if (error) {
    console.log(
      JSON.stringify(
        {
          select: selectList,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        },
        null,
        2
      )
    );
    process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify({ ok: true, rows: (data || []).length }, null, 2));
};

main().catch((e) => {
  console.error("Unexpected failure:", e?.message || e);
  process.exitCode = 1;
});
