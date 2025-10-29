import http from "node:http";
import fs from "node:fs";
import { Command } from "commander";

const program = new Command();

program
  .requiredOption("-h, --host <string>", "Адреса сервера")
  .requiredOption("-p, --port <number>", "Порт сервера")
  .requiredOption("-c, --cache <path>", "Шлях до директорії кешу");

program.parse(process.argv);

const { host, port, cache } = program.opts();

// створення директорії кешу, якщо її немає
if (!fs.existsSync(cache)) {
 console.log(`Cache directory does not exist. Creating: ${cache}`);
  fs.mkdirSync(cache, { recursive: true });
}

// створення простого веб-сервера
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Proxy server is running!");
});

server.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
  console.log(`Cache directory: ${cache}`);
});
