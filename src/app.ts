import express from "express";
import cors from "cors";
import routes from "./routes";
import {responseFormatter} from "./middlewares/response-formatter"

export const app = express();

app.use(cors());

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
  });
});

// Routes will go here later
// app.use("/api", routes);
app.use("/api", routes);
app.use(responseFormatter);

export default app;