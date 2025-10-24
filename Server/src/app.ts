import express from "express";
import userAuth from "./Routes/userRoutes";
import enterpriseRoute from "./Routes/enterpriseRoute";
import groupRoutes from "./Routes/groupRoutes";
import releaseRoutes from "./Routes/releaseRoute";
import cors from "cors";
import adminRoutes from "./Routes/adminRoutes";

const app = express();
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
// rotas
app.use("/users", userAuth);
app.use("/enterprises", enterpriseRoute);
app.use("/groups", groupRoutes);
app.use("/releases", releaseRoutes);

//ROTAS DO ADMIN
app.use("/admins", adminRoutes);
export default app;
