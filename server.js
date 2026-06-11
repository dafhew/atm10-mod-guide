const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const requested = decoded === "/" ? "/index.html" : decoded;
  const resolved = path.resolve(root, `.${requested}`);
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

const server = http.createServer((request, response) => {
  const filePath = safePath(request.url || "/");
  if (!filePath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(content);
  });
});

server.listen(port, host, () => {
  console.log(`ATM10 guide running at http://localhost:${port}`);
  console.log(`LAN users can try http://<your-computer-ip>:${port}`);
});
