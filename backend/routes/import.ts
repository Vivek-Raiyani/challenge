import { Router, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import { parseCsvBuffer } from "../services/csvParser";
import { processImport } from "../services/batchProcessor";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith(".csv")) {
      cb(new Error("Only CSV files are allowed"));
      return;
    }
    cb(null, true);
  },
});

router.post(
  "/import",
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "sk-...") {
        res.status(500).json({ error: "OPENAI_API_KEY is not configured" });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: "No file uploaded. Use field name 'file'." });
        return;
      }

      const rows = parseCsvBuffer(req.file.buffer);
      console.log(
        `[import] ${req.file.originalname} — ${rows.length} rows, ${(req.file.size / 1024).toFixed(1)} KB`
      );

      const result = await processImport(rows);

      console.log(
        `[import] done — ${result.stats.imported} imported, ${result.stats.skipped} skipped`
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
