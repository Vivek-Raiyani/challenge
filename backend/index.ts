import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import importRouter from "./routes/import";
import { getAllowedOrigins } from "./config/cors";
import { requestLogger } from "./middleware/requestLogger";

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const allowedOrigins = getAllowedOrigins();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
  })
);
app.use(express.json());
app.use(requestLogger);

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.use("/api", importRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ error: "File too large. Maximum size is 5MB." });
      return;
    }
    res.status(400).json({ error: err.message });
    return;
  }

  if (err instanceof Error) {
    if (err.message.includes("CORS")) {
      res.status(403).json({ error: err.message });
      return;
    }

    const status =
      err.message.includes("AI") ||
      err.message.includes("OpenAI") ||
      err.message.includes("API")
        ? 502
        : 400;
    res.status(status).json({ error: err.message });
    return;
  }

  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`CORS allowed origins: ${allowedOrigins.join(", ")}`);
});
