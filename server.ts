import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API to list character sheets
  app.get("/api/sheets", (req, res) => {
    const sheetsDir = path.join(process.cwd(), "public", "charactersheets");
    if (!fs.existsSync(sheetsDir)) {
      return res.json([]);
    }
    const files = fs.readdirSync(sheetsDir);
    // Filter for front images and extract class/race
    const sheets = files
      .filter(f => f.endsWith("_f.jpg"))
      .map(f => f.replace("_f.jpg", ""));
    res.json(sheets);
  });

  // Serve character sheets and other public assets
  app.use(express.static(path.join(process.cwd(), "public")));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
