import { getStore } from "@netlify/blobs";

function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function csvEscape(value) {
  const s = value == null ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default async (req) => {
  const token = process.env.RATING_EXPORT_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: "RATING_EXPORT_TOKEN is not configured" }), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
    });
  }

  const supplied =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    new URL(req.url).searchParams.get("token") ||
    "";

  if (supplied !== token) return unauthorized();

  const url = new URL(req.url);
  const format = (url.searchParams.get("format") || "csv").toLowerCase();
  const store = getStore("cli-rider-ratings");

  const records = [];
  let cursor;

  do {
    const page = await store.list({ prefix: "ratings/", cursor });
    for (const blob of page.blobs || []) {
      const value = await store.get(blob.key, { type: "json" });
      if (value) records.push(value);
    }
    cursor = page.next_cursor || page.cursor || null;
  } while (cursor);

  records.sort((a,b) => String(a.submitted_at || "").localeCompare(String(b.submitted_at || "")));

  if (format === "json") {
    return new Response(JSON.stringify({
      exported_at: new Date().toISOString(),
      count: records.length,
      records
    }, null, 2), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": 'attachment; filename="cli-rider-ratings.json"',
        "cache-control": "no-store"
      }
    });
  }

  const headers = [
    "submitted_at","ride_fingerprint","rider_rating","cli_version","cli",
    "p50","rshort","rlong","distance_m","elevation_gain_m","source"
  ];

  const lines = [headers.join(",")];
  for (const r of records) {
    lines.push(headers.map(h => csvEscape(r[h])).join(","));
  }

  return new Response(lines.join("\n"), {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="cli-rider-ratings.csv"',
      "cache-control": "no-store"
    }
  });
};
