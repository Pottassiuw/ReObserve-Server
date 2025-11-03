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
const corsOptions = {
    origin: /*process.env.FRONTEND_URL */ "http://localhost:4173",
    credentials: true,
    optionsSuccessStatus: 200,
};
app.use((0, cors_1.default)(corsOptions));
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
