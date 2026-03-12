import express from "express";
import userRoutes from "./Modules/users/api/route";
import authRoutes from "./Modules/auth/api/route";
import { logger } from "./utils/logger";
import pinoHttp from "pino-http";

const app = express();

app.use(pinoHttp({ logger }));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api", userRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ message: "Server is healthy" });
});

export default app;
