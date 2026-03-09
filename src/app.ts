import express from "express";
import userAuth from "./Routes/userRoutes";
import enterpriseRoute from "./Routes/enterpriseRoute";
import groupRoutes from "./Routes/groupRoutes";
import releaseRoutes from "./Routes/releaseRoute";
import cors, { type CorsOptions } from "cors";
import adminRoutes from "./Routes/adminRoutes";
import periodRoutes from "./Routes/periodRoutes";

const app = express();
<<<<<<< HEAD

const normalizeOrigin = (origin?: string) => origin?.trim().replace(/\/$/, "");

const configuredOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_DEV_URL,
  process.env.CLIENT_URL,
]
  .map(normalizeOrigin)
  .filter((origin): origin is string => Boolean(origin));

const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
const vercelPreviewRegex = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;

const isAllowedOrigin = (origin?: string) => {
  if (!origin) {
    return true;
  }

  const normalizedOrigin = normalizeOrigin(origin);

  if (!normalizedOrigin) {
    return false;
  }

  return (
    configuredOrigins.includes(normalizedOrigin) ||
    localhostRegex.test(normalizedOrigin) ||
    vercelPreviewRegex.test(normalizedOrigin)
  );
};

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
=======
const corsOptions = {
  // origin: process.env.FRONTEND_URL,
  origin: "http://localhost:4173",
>>>>>>> 1e7c986d (Fixede some bugs, still missing changin for deploy api keys)
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());
// rotas
app.use("/users", userAuth);
app.use("/enterprises", enterpriseRoute);
app.use("/groups", groupRoutes);
app.use("/releases", releaseRoutes);
app.use("/periods", periodRoutes);
//ROTAS DO ADMIN
app.use("/admins", adminRoutes);
export default app;
