import express from "express";
import cors from "cors";
import {env} from "./config/env"
import mainApiRoutes from "./routes/index"
import {responseFormatter} from "./middlewares/response-formatter"
import {notFound} from "./middlewares/not-found"
import {globalErrorHandler} from "./middlewares/error-handler"

export const app = express();

// Global middleware
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.disable("x-powered-by");
app.use(responseFormatter);

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "shopkb is running",
  });
});


// access point route for all
app.use("/api", mainApiRoutes);


// 404 handler
app.use(notFound);

// Global error handler
app.use(globalErrorHandler);

export default app;