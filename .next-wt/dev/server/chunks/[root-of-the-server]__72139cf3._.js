module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/.claude/worktrees/playoff-suite/lib/supabase/env.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getSupabaseEnv",
    ()=>getSupabaseEnv
]);
function getSupabaseEnv() {
    const url = ("TURBOPACK compile-time value", "https://zrwqyfsfvvlcaeywoqvt.supabase.co");
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpyd3F5ZnNmdnZsY2FleXdvcXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4MzUzNDUsImV4cCI6MjEwMDQxMTM0NX0.kHZNXjE9VJHhJ85roivl4EM2oJpnJ8OEBwGAP8Ex5xc");
    return ("TURBOPACK compile-time truthy", 1) ? {
        url,
        key
    } : "TURBOPACK unreachable";
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/supabase/server.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createClient",
    ()=>createClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createServerClient.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$supabase$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/supabase/env.ts [app-route] (ecmascript)");
;
;
;
async function createClient() {
    const env = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$supabase$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSupabaseEnv"])();
    if (!env) return null;
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])(env.url, env.key, {
        cookies: {
            getAll () {
                return cookieStore.getAll();
            },
            setAll (cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options })=>cookieStore.set(name, value, options));
                } catch  {
                // Proxy refreshes cookies when this runs in a Server Component.
                }
            }
        }
    });
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/supabase/auth.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PRO_FEATURES",
    ()=>PRO_FEATURES,
    "getAuthenticatedClient",
    ()=>getAuthenticatedClient,
    "getEntitlements",
    ()=>getEntitlements
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$server$2d$only$2f$empty$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/server-only/empty.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/supabase/server.ts [app-route] (ecmascript)");
;
;
async function getAuthenticatedClient() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createClient"])();
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;
    const email = typeof data?.claims?.email === "string" ? data.claims.email : undefined;
    const metadata = data?.claims?.user_metadata;
    const userMetadata = metadata && typeof metadata === "object" ? metadata : {};
    const displayName = [
        userMetadata.full_name,
        userMetadata.name,
        userMetadata.display_name
    ].find((value)=>typeof value === "string" && value.trim().length > 0)?.trim();
    const avatarUrl = [
        userMetadata.avatar_url,
        userMetadata.picture
    ].find((value)=>typeof value === "string" && value.trim().length > 0)?.trim();
    return !error && userId ? {
        supabase,
        userId,
        email,
        displayName,
        avatarUrl
    } : null;
}
const PRO_FEATURES = [
    "public_sharing",
    "scorekeeping",
    "multiple_schedules",
    "standings",
    "playoffs",
    "simulator",
    "platform_sync",
    "notifications",
    "advanced_fairness",
    "no_ads"
];
async function getEntitlements(userId, supabase, scheduleId) {
    const { data } = await supabase.from("billing_access_grants").select("feature,plan_key,scope_type,schedule_id").eq("user_id", userId);
    const grants = data ?? [];
    const accountPro = grants.some((grant)=>grant.scope_type === "account" && (grant.plan_key === "monthly_pro" || grant.plan_key === "annual_pro"));
    const schedulePro = Boolean(scheduleId && grants.some((grant)=>grant.scope_type === "schedule" && grant.schedule_id === scheduleId));
    const features = accountPro ? [
        ...PRO_FEATURES
    ] : Array.from(new Set(grants.filter((grant)=>grant.scope_type === "account" || grant.schedule_id === scheduleId).map((grant)=>grant.feature)));
    return {
        plan: accountPro ? "pro" : "free",
        accountPro,
        schedulePro,
        features
    };
}
}),
"[project]/.claude/worktrees/playoff-suite/app/api/entitlements/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$supabase$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/supabase/auth.ts [app-route] (ecmascript)");
;
;
async function GET(request) {
    const auth = await (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$supabase$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getAuthenticatedClient"])();
    if (!auth) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        signedIn: false,
        plan: "free",
        features: []
    });
    const scheduleId = new URL(request.url).searchParams.get("scheduleId") || undefined;
    const entitlements = await (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$supabase$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getEntitlements"])(auth.userId, auth.supabase, scheduleId);
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        signedIn: true,
        email: auth.email,
        displayName: auth.displayName,
        avatarUrl: auth.avatarUrl,
        ...entitlements
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__72139cf3._.js.map