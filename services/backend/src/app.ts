import express from "express";
import cors from "cors";
import apiRoutes from "./api/routes/index.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    data: {
      status: "ok",
    },
  });
});

app.use("/api/v1", apiRoutes);

export default app;