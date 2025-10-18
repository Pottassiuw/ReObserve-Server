"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const supabase = new supabase_js_1.SupabaseClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_SECRET || "");
exports.default = supabase;
