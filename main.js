// Підключення необхідних модулів
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";
import superagent from "superagent"; // Підключення для Частини 3

// Налаштування параметрів командного рядка
const program = new Command();
program
  .requiredOption("-h, --host <string>", "Адреса сервера")
  .requiredOption("-p, --port <number>", "Порт сервера")
  .requiredOption("-c, --cache <path>", "Шлях до директорії кешу");
program.parse(process.argv);

const { host, port, cache } = program.opts();

// Створення директорії кешу, якщо вона відсутня
const ensureCacheDir = async () => {
  try {
    await fs.mkdir(cache, { recursive: true });
  } catch (err) {
    console.error("Error: Failed to create cache directory");
    process.exit(1);
  }
};

// Створення веб-сервера
const server = http.createServer(async (req, res) => {
  const code = req.url.slice(1); // код статусу

  if (!code || isNaN(code)) {
    res.writeHead(400);
    return res.end("Invalid HTTP code");
  }

  const filePath = path.join(cache, `${code}.jpg`);

  try {
    switch (req.method) {

      // Метод GET → через кеш або http.cat
      case "GET": {
        try {
          const image = await fs.readFile(filePath);
          res.writeHead(200, { "Content-Type": "image/jpeg" });
          return res.end(image);
        } catch {
          try {
            // Завантаження з http.cat
            const response = await superagent.get(`https://http.cat/${code}.jpg`);
            const image = response.body;

            // Збереження у кеш
            await fs.writeFile(filePath, image);

            res.writeHead(200, { "Content-Type": "image/jpeg" });
            return res.end(image);

          } catch (err) {
            res.writeHead(404);
            return res.end("Not found");
          }
        }
      }
      // Метод PUT → запис у кеш (тіло запиту містить файл)
      case "PUT": {
        const data = [];
        req.on("data", chunk => data.push(chunk));
        req.on("end", async () => {
          const body = Buffer.concat(data);
          await fs.writeFile(filePath, body);
          res.writeHead(201);
          res.end("Created");
        });
        break;
      }
      // Метод DELETE → видалення файлу з кешу
      case "DELETE": {
        try {
          await fs.unlink(filePath);
          res.writeHead(200);
          res.end("Deleted");
        } catch {
          res.writeHead(404);
          res.end("Not found");
        }
        break;
      }
      // Інші методи не допускаються
      default:
        res.writeHead(405);
        res.end("Method not allowed");
    }
  } catch (err) {
    console.error("Internal server error:", err);
    res.writeHead(500);
    res.end("Internal Server Error");
  }
});

// Запуск сервера
await ensureCacheDir();
server.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
  console.log(`Cache directory: ${cache}`);
});
