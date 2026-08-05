const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { once } = require("node:events");

async function withServer(fn) {
  delete require.cache[require.resolve("../src/index.js")];
  process.env.PORT = "0";

  const server = require("../src/index.js");
  await once(server, "listening");
  const { port } = server.address();

  try {
    await fn(port);
  } finally {
    server.close();
  }
}

function get(port, path) {
  return new Promise((resolve, reject) => {
    http
      .get(`http://127.0.0.1:${port}${path}`, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
      })
      .on("error", reject);
  });
}

test("GET /health returns 200 and status ok", async () => {
  await withServer(async (port) => {
    const res = await get(port, "/health");
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers["content-type"], "application/json");
    const json = JSON.parse(res.body);
    assert.equal(json.status, "ok");
    assert.ok(json.version);
  });
});

test("GET / returns 200 and HTML", async () => {
  await withServer(async (port) => {
    const res = await get(port, "/");
    assert.equal(res.statusCode, 200);
    assert.match(res.headers["content-type"], /text\/html/);
    assert.match(res.body, /<!DOCTYPE html>/);
  });
});

test("GET /nope returns 404", async () => {
  await withServer(async (port) => {
    const res = await get(port, "/nope");
    assert.equal(res.statusCode, 404);
  });
});
