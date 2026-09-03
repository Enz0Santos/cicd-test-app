const http = require("http");

const PORT = process.env.PORT === undefined || process.env.PORT === "" ?
    3000 :
    Number(process.env.PORT);

// ---------------------------------------------------------------------------
// CHANGE THESE to make a visible difference after a deploy (portfolio demos).
// Bump APP_VERSION and/or edit APP_MESSAGE, push, then reload.
// ---------------------------------------------------------------------------
const APP_VERSION = "1.1.0";
const APP_MESSAGE = "Deployed by GitHub Actions → GHCR → Coolify";
const APP_COLOR = "#2563eb"; // header accent; try #0f766e, #b45309, #7c3aed, etc.

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function homePage() {
    const message = escapeHtml(APP_MESSAGE);
    const version = escapeHtml(APP_VERSION);
    const color = escapeHtml(APP_COLOR);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>cicd-test-app v${version}</title>
  <style>
    :root { color-scheme: light dark; --accent: ${color}; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      background: #0b1220;
      color: #e5e7eb;
      display: grid;
      place-items: center;
      padding: 1.5rem;
    }
    main {
      width: min(36rem, 100%);
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 1rem;
      padding: 1.75rem;
      box-shadow: 0 20px 40px rgba(0,0,0,.35);
    }
    .badge {
      display: inline-block;
      background: color-mix(in srgb, var(--accent) 20%, transparent);
      color: #bfdbfe;
      border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
      border-radius: 999px;
      padding: .25rem .7rem;
      font-size: .8rem;
      font-weight: 600;
      letter-spacing: .02em;
    }
    h1 {
      margin: 1rem 0 .5rem;
      font-size: 1.6rem;
      line-height: 1.25;
      color: #f9fafb;
    }
    p { margin: .4rem 0; color: #9ca3af; line-height: 1.5; }
    dl {
      margin: 1.25rem 0 0;
      display: grid;
      grid-template-columns: 8rem 1fr;
      gap: .4rem .75rem;
      font-size: .95rem;
    }
    dt { color: #6b7280; }
    dd { margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #e5e7eb; }
    footer {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #1f2937;
      font-size: .85rem;
      color: #6b7280;
    }
    code { color: #93c5fd; }
  </style>
</head>
<body>
  <main>
    <span class="badge">live</span>
    <h1>${message}</h1>
    <p>Minimal Node app for testing a CI/CD pipeline (build, test, containerize, deploy).</p>
    <dl>
      <dt>version</dt><dd>${version}</dd>
      <dt>health</dt><dd><code>/health</code></dd>
    </dl>
    <footer>
      Edit <code>APP_VERSION</code> / <code>APP_MESSAGE</code> / <code>APP_COLOR</code> in
      <code>src/index.js</code>, push, and reload this page to confirm the pipeline.
    </footer>
  </main>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
    if (req.url === "/health" && req.method === "GET") {
        res.writeHead(200, {
            "Content-Type": "application/json"
        });
        res.end(JSON.stringify({
            status: "ok",
            version: APP_VERSION
        }));
        return;
    }

    if ((req.url === "/" || req.url === "/index.html") && req.method === "GET") {
        res.writeHead(200, {
            "Content-Type": "text/html; charset=utf-8"
        });
        res.end(homePage());
        return;
    }

    res.writeHead(404, {
        "Content-Type": "text/plain; charset=utf-8"
    });
    res.end("Not found\n");
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Listening on port ${server.address().port} (v${APP_VERSION})`);
});

module.exports = server;