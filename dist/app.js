"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userRoutes_1 = __importDefault(require("./Routes/userRoutes"));
const enterpriseRoute_1 = __importDefault(require("./Routes/enterpriseRoute"));
const groupRoutes_1 = __importDefault(require("./Routes/groupRoutes"));
const releaseRoute_1 = __importDefault(require("./Routes/releaseRoute"));
const cors_1 = __importDefault(require("cors"));
const adminRoutes_1 = __importDefault(require("./Routes/adminRoutes"));
const periodRoutes_1 = __importDefault(require("./Routes/periodRoutes"));
const app = (0, express_1.default)();
const normalizeOrigin = (origin) => origin?.trim().replace(/\/$/, "");
const configuredOrigins = [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_DEV_URL,
    process.env.CLIENT_URL,
]
    .map(normalizeOrigin)
    .filter((origin) => Boolean(origin));
const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
const vercelPreviewRegex = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;
const isAllowedOrigin = (origin) => {
    if (!origin) {
        return true;
    }
    const normalizedOrigin = normalizeOrigin(origin);
    if (!normalizedOrigin) {
        return false;
    }
    return (configuredOrigins.includes(normalizedOrigin) ||
        localhostRegex.test(normalizedOrigin) ||
        vercelPreviewRegex.test(normalizedOrigin));
};
const corsOptions = {
<<<<<<< HEAD
    origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error(`CORS blocked for origin: ${origin}`));
    },
=======
    // origin: process.env.FRONTEND_URL,
    origin: "http://localhost:4173",
>>>>>>> 1e7c986d (Fixede some bugs, still missing changin for deploy api keys)
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
};
app.use((0, cors_1.default)(corsOptions));
app.options(/.*/, (0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
// rotas
app.use("/users", userRoutes_1.default);
app.use("/enterprises", enterpriseRoute_1.default);
app.use("/groups", groupRoutes_1.default);
app.use("/releases", releaseRoute_1.default);
app.use("/periods", periodRoutes_1.default);
//ROTAS DO ADMIN
app.use("/admins", adminRoutes_1.default);
exports.default = app;
