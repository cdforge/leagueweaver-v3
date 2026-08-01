module.exports = [
"[project]/.claude/worktrees/playoff-suite/components/account/AccountIdentity.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AccountIdentity",
    ()=>AccountIdentity
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$user$2d$round$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CircleUserRound$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-user-round.mjs [app-ssr] (ecmascript) <export default as CircleUserRound>");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/supabase/client.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$account$2f$AuthModalProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/components/account/AuthModalProvider.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
function metadataValue(metadata, keys) {
    return keys.map((key)=>metadata[key]).find((value)=>typeof value === "string" && value.trim().length > 0)?.trim();
}
function friendlyEmailName(email) {
    const local = email?.split("@")[0]?.replace(/[._-]+/g, " ").trim();
    return local ? local.replace(/\b\w/g, (letter)=>letter.toUpperCase()) : "Commissioner";
}
function accountInitials(name) {
    const words = name.match(/[A-Za-z0-9]+/g) ?? [];
    const first = words[0] ?? "";
    const second = words[1] ?? "";
    return (second ? `${first[0] ?? ""}${second[0] ?? ""}` : first.slice(0, 2) || "LW").toUpperCase();
}
function identityFromUser(user) {
    if (!user) return {
        signedIn: false
    };
    const metadata = user.user_metadata ?? {};
    return {
        signedIn: true,
        email: user.email,
        displayName: metadataValue(metadata, [
            "full_name",
            "name",
            "display_name"
        ]),
        avatarUrl: metadataValue(metadata, [
            "avatar_url",
            "picture"
        ])
    };
}
function AccountIdentity({ identity, plan }) {
    const [resolved, setResolved] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(identity ?? {
        signedIn: false
    });
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(identity === undefined);
    const { openSignIn } = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$account$2f$AuthModalProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuthModal"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (identity !== undefined) {
            setResolved(identity);
            setLoading(false);
            return;
        }
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createClient"])();
        if (!supabase) {
            setLoading(false);
            return;
        }
        let active = true;
        supabase.auth.getUser().then(({ data })=>{
            if (active) {
                setResolved(identityFromUser(data.user));
                setLoading(false);
            }
        });
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session)=>{
            if (active) {
                setResolved(identityFromUser(session?.user ?? null));
                setLoading(false);
            }
        });
        return ()=>{
            active = false;
            listener.subscription.unsubscribe();
        };
    }, [
        identity
    ]);
    if (!resolved.signedIn) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        type: "button",
        onClick: ()=>openSignIn(),
        className: `account-link account-identity${loading ? " loading" : ""}`,
        "aria-label": "Sign in to League Weaver",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$user$2d$round$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CircleUserRound$3e$__["CircleUserRound"], {
                "aria-hidden": "true"
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/account/AccountIdentity.tsx",
                lineNumber: 78,
                columnNumber: 195
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                    children: loading ? "Account" : "Sign in"
                }, void 0, false, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/account/AccountIdentity.tsx",
                    lineNumber: 78,
                    columnNumber: 239
                }, this)
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/account/AccountIdentity.tsx",
                lineNumber: 78,
                columnNumber: 233
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/account/AccountIdentity.tsx",
        lineNumber: 78,
        columnNumber: 34
    }, this);
    const name = resolved.displayName || friendlyEmailName(resolved.email);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
        href: "/account",
        className: "account-link account-identity",
        "aria-label": `Open account for ${name}`,
        title: resolved.email,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: `account-avatar${resolved.avatarUrl ? " has-image" : ""}`,
                "aria-hidden": "true",
                children: resolved.avatarUrl ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                    src: resolved.avatarUrl,
                    alt: ""
                }, void 0, false, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/account/AccountIdentity.tsx",
                    lineNumber: 82,
                    columnNumber: 122
                }, this) : accountInitials(name)
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/account/AccountIdentity.tsx",
                lineNumber: 82,
                columnNumber: 5
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "account-identity-copy",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: name
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/account/AccountIdentity.tsx",
                        lineNumber: 83,
                        columnNumber: 45
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "My Account"
                        }, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/account/AccountIdentity.tsx",
                            lineNumber: 83,
                            columnNumber: 75
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/account/AccountIdentity.tsx",
                        lineNumber: 83,
                        columnNumber: 68
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/account/AccountIdentity.tsx",
                lineNumber: 83,
                columnNumber: 5
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/account/AccountIdentity.tsx",
        lineNumber: 81,
        columnNumber: 10
    }, this);
}
}),
"[project]/.claude/worktrees/playoff-suite/components/AppHeader.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AppHeader",
    ()=>AppHeader,
    "BrandLockup",
    ()=>BrandLockup
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-right.mjs [app-ssr] (ecmascript) <export default as ArrowRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__TriangleAlert$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.mjs [app-ssr] (ecmascript) <export default as TriangleAlert>");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$account$2f$AccountIdentity$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/components/account/AccountIdentity.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$Modal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/components/ui/Modal.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
;
function BrandLockup({ compact = false }) {
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const [confirmOpen, setConfirmOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    // The builder route holds in-progress setup that leaving could discard.
    const guarded = pathname === "/";
    const handleClick = (event)=>{
        if (!guarded) return;
        event.preventDefault();
        setConfirmOpen(true);
    };
    const leaveToWelcome = ()=>{
        setConfirmOpen(false);
        router.push("/welcome");
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                className: "brand-lockup",
                href: "/welcome",
                "aria-label": "League Weaver home",
                onClick: handleClick,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        src: "/branding/leagueweaver-mark.svg",
                        alt: "",
                        width: 40,
                        height: 40,
                        priority: true
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/AppHeader.tsx",
                        lineNumber: 31,
                        columnNumber: 9
                    }, this),
                    !compact && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: "LEAGUE WEAVER"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/AppHeader.tsx",
                                lineNumber: 34,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                children: "FANTASY FOOTBALL STUDIO"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/AppHeader.tsx",
                                lineNumber: 35,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/AppHeader.tsx",
                        lineNumber: 33,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/AppHeader.tsx",
                lineNumber: 30,
                columnNumber: 7
            }, this),
            confirmOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$Modal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ConfirmDialog"], {
                tone: "gold",
                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__TriangleAlert$3e$__["TriangleAlert"], {}, void 0, false, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/AppHeader.tsx",
                    lineNumber: 42,
                    columnNumber: 17
                }, void 0),
                kicker: "LEAVE SETUP",
                title: "Leave the builder?",
                labelId: "leave-builder-title",
                descriptionId: "leave-builder-description",
                closeLabel: "Stay in the builder",
                onClose: ()=>setConfirmOpen(false),
                actions: [
                    {
                        label: "Stay here",
                        onClick: ()=>setConfirmOpen(false),
                        variant: "secondary",
                        autoFocus: true
                    },
                    {
                        label: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                "Leave to welcome",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__["ArrowRight"], {}, void 0, false, {
                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/AppHeader.tsx",
                                    lineNumber: 51,
                                    columnNumber: 40
                                }, void 0)
                            ]
                        }, void 0, true),
                        onClick: leaveToWelcome,
                        variant: "danger"
                    }
                ],
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    id: "leave-builder-description",
                    children: "You’ll go back to the welcome page. Your current league setup could be lost if you start a new league from there."
                }, void 0, false, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/AppHeader.tsx",
                    lineNumber: 54,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/AppHeader.tsx",
                lineNumber: 40,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true);
}
function AppHeader() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        className: "topbar",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "page-width topbar-row",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(BrandLockup, {}, void 0, false, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/AppHeader.tsx",
                    lineNumber: 65,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                    className: "topnav",
                    "aria-label": "Primary navigation",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$account$2f$AccountIdentity$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AccountIdentity"], {}, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/AppHeader.tsx",
                        lineNumber: 67,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/AppHeader.tsx",
                    lineNumber: 66,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/.claude/worktrees/playoff-suite/components/AppHeader.tsx",
            lineNumber: 64,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/AppHeader.tsx",
        lineNumber: 63,
        columnNumber: 5
    }, this);
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/welcome.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WELCOMED_KEY",
    ()=>WELCOMED_KEY,
    "hasBeenWelcomed",
    ()=>hasBeenWelcomed,
    "markWelcomed",
    ()=>markWelcomed
]);
const WELCOMED_KEY = "leagueweaver:v3:welcomed";
function markWelcomed() {
    try {
        window.localStorage.setItem(WELCOMED_KEY, "1");
    } catch  {
    // Ignore storage failures; navigation still proceeds.
    }
}
function hasBeenWelcomed() {
    try {
        return window.localStorage.getItem(WELCOMED_KEY) === "1";
    } catch  {
        return false;
    }
}
}),
"[project]/.claude/worktrees/playoff-suite/components/welcome/StartBuildingButton.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StartBuildingButton",
    ()=>StartBuildingButton
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-right.mjs [app-ssr] (ecmascript) <export default as ArrowRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$welcome$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/welcome.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
function StartBuildingButton({ href = "/", label = "Get started", className = "button-primary welcome-cta" }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
        href: href,
        className: className,
        onClick: __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$welcome$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["markWelcomed"],
        children: [
            label,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__["ArrowRight"], {
                "aria-hidden": "true"
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/StartBuildingButton.tsx",
                lineNumber: 19,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/StartBuildingButton.tsx",
        lineNumber: 17,
        columnNumber: 5
    }, this);
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/colorContrast.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "accessibleAccentColor",
    ()=>accessibleAccentColor,
    "accessibleTeamColor",
    ()=>accessibleTeamColor,
    "readableTextColor",
    ()=>readableTextColor,
    "tintColor",
    ()=>tintColor
]);
function channel(value) {
    const normalized = value / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}
function luminance(hex) {
    const clean = hex.replace("#", "");
    const value = clean.length === 3 ? clean.split("").map((part)=>part + part).join("") : clean;
    if (!/^[0-9a-f]{6}$/i.test(value)) return 0;
    const red = channel(parseInt(value.slice(0, 2), 16));
    const green = channel(parseInt(value.slice(2, 4), 16));
    const blue = channel(parseInt(value.slice(4, 6), 16));
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}
function rgb(hex) {
    const clean = hex.replace("#", "");
    const value = clean.length === 3 ? clean.split("").map((part)=>part + part).join("") : clean;
    if (!/^[0-9a-f]{6}$/i.test(value)) return [
        17,
        122,
        69
    ];
    return [
        parseInt(value.slice(0, 2), 16),
        parseInt(value.slice(2, 4), 16),
        parseInt(value.slice(4, 6), 16)
    ];
}
function mixColor(color, target, amount) {
    const from = rgb(color);
    const to = rgb(target);
    const mixed = from.map((value, index)=>Math.round(value + (to[index] - value) * amount));
    return `#${mixed.map((value)=>value.toString(16).padStart(2, "0")).join("")}`;
}
function contrastRatio(first, second) {
    const firstLuminance = luminance(first);
    const secondLuminance = luminance(second);
    return (Math.max(firstLuminance, secondLuminance) + 0.05) / (Math.min(firstLuminance, secondLuminance) + 0.05);
}
function tintColor(color, amount = 0.82) {
    const mixed = rgb(color).map((value)=>Math.round(value + (255 - value) * amount));
    return `#${mixed.map((value)=>value.toString(16).padStart(2, "0")).join("")}`;
}
function accessibleAccentColor(color, background = "#15231C") {
    const backgroundLuminance = luminance(background);
    for (const amount of [
        0,
        0.18,
        0.32,
        0.46,
        0.6,
        0.74,
        0.84
    ]){
        const candidate = tintColor(color, amount);
        const candidateLuminance = luminance(candidate);
        const contrast = (Math.max(backgroundLuminance, candidateLuminance) + 0.05) / (Math.min(backgroundLuminance, candidateLuminance) + 0.05);
        if (contrast >= 4.5) return candidate;
    }
    return "#FFFFFF";
}
function accessibleTeamColor(color, background = "#FFFFFF") {
    for (const amount of [
        0,
        0.16,
        0.28,
        0.4,
        0.54,
        0.68,
        0.82
    ]){
        const candidate = mixColor(color, "#15231C", amount);
        if (contrastRatio(candidate, background) >= 4.5) return candidate;
    }
    return "#15231C";
}
function readableTextColor(background) {
    const ink = "#15231C";
    const inkContrast = contrastRatio(ink, background);
    const whiteContrast = contrastRatio("#FFFFFF", background);
    const softBest = inkContrast >= whiteContrast ? ink : "#FFFFFF";
    if (Math.max(inkContrast, whiteContrast) >= 4.5) return softBest;
    // Mid-tone: neither soft option clears AA. Fall back to the pure extreme with
    // the most contrast — one of pure black / white always exceeds 4.5:1.
    return contrastRatio("#000000", background) >= whiteContrast ? "#000000" : "#FFFFFF";
}
}),
"[project]/.claude/worktrees/playoff-suite/components/ui/EntityLogo.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EntityLogo",
    ()=>EntityLogo
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$colorContrast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/colorContrast.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
function EntityLogo({ color, logoUrl, monogram, size = 32, className = "", imagePresentation = "tinted" }) {
    const [failedLogo, setFailedLogo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const visibleLogo = logoUrl && failedLogo !== logoUrl ? logoUrl : undefined;
    const enforcedSize = Math.max(32, size);
    const bareImage = Boolean(visibleLogo && imagePresentation === "bare");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: `entity-logo ${visibleLogo ? "entity-logo-has-image" : ""} ${bareImage ? "entity-logo-bare-image" : ""} ${className}`,
        style: {
            "--entity-color": color,
            width: enforcedSize,
            height: enforcedSize,
            background: bareImage ? "transparent" : visibleLogo ? (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$colorContrast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tintColor"])(color) : color,
            color: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$colorContrast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["readableTextColor"])(color)
        },
        children: visibleLogo ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
            src: visibleLogo,
            alt: "",
            onError: ()=>setFailedLogo(visibleLogo)
        }, void 0, false, {
            fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/EntityLogo.tsx",
            lineNumber: 12,
            columnNumber: 20
        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            children: monogram
        }, void 0, false, {
            fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/EntityLogo.tsx",
            lineNumber: 12,
            columnNumber: 98
        }, this)
    }, void 0, false, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/EntityLogo.tsx",
        lineNumber: 11,
        columnNumber: 10
    }, this);
}
}),
"[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SchedulePreview",
    ()=>SchedulePreview
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$column$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart3$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chart-column.mjs [app-ssr] (ecmascript) <export default as BarChart3>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/map-pin.mjs [app-ssr] (ecmascript) <export default as MapPin>");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$EntityLogo$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/components/ui/EntityLogo.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
const LEAGUE = {
    name: "Prodigies vs Esteemed FFL",
    color: "#117A45",
    logo: "/pve/league.png"
};
const DIVISIONS = {
    prodigy: {
        name: "Prodigy",
        color: "#E9E9E9",
        logo: "/pve/division-prodigies.png"
    },
    esteemed: {
        name: "Esteemed",
        color: "#FFD124",
        logo: "/pve/division-esteemed.png"
    }
};
const TEAMS = {
    Decoupes: {
        rank: 1,
        city: "Bandera",
        name: "Decoupes",
        logo: "/pve/team-decoupes.png",
        color: "#BC2539",
        venue: "Decoupes Stadium",
        division: "prodigy"
    },
    Mutts: {
        rank: 2,
        city: "Uncross Your",
        name: "Mutts",
        logo: "/pve/team-mutts.png",
        color: "#BDBDBD",
        venue: "Mutts Stadium",
        division: "esteemed"
    },
    Popeyes: {
        rank: 3,
        city: "West End",
        name: "Popeyes",
        logo: "/pve/team-popeyes.png",
        color: "#FF8B29",
        venue: "Popeyes Stadium",
        division: "prodigy"
    },
    Yardies: {
        rank: 4,
        city: "Cumgetsum",
        name: "Yardies",
        logo: "/pve/team-yardies.png",
        color: "#027546",
        venue: "Yardies Stadium",
        division: "esteemed"
    },
    MetaMookDawgs: {
        rank: 5,
        city: "Decatur",
        name: "MetaMookDawgs",
        logo: "/pve/team-metamookdawgs.png",
        color: "#F292FF",
        venue: "MetaMookDawgs Stadium",
        division: "esteemed"
    },
    Savages: {
        rank: 6,
        city: "East Atlanta",
        name: "Savages",
        logo: "/pve/team-savages.png",
        color: "#FF0000",
        venue: "Savages Stadium",
        division: "prodigy"
    },
    Green: {
        rank: 7,
        city: "Georgia",
        name: "Green",
        logo: "/pve/team-green.png",
        color: "#071A7D",
        venue: "Green Stadium",
        division: "prodigy"
    },
    Champs: {
        rank: 8,
        city: "Down South",
        name: "Champs",
        logo: "/pve/team-champs.png",
        color: "#F04E37",
        venue: "Champs Stadium",
        division: "esteemed"
    },
    Eagles: {
        rank: 9,
        city: "Rex",
        name: "Eagles",
        logo: "/pve/team-eagles.png",
        color: "#93FF41",
        venue: "Eagles Stadium",
        division: "esteemed"
    },
    Kings: {
        rank: 10,
        city: "McDonough",
        name: "Kings",
        logo: "/pve/team-kings.png",
        color: "#6400DB",
        venue: "Kings Stadium",
        division: "prodigy"
    }
};
const WEEK_DATES = [
    "Sep 9–15",
    "Sep 16–22",
    "Sep 23–29",
    "Sep 30–Oct 6",
    "Oct 7–13",
    "Oct 14–20",
    "Oct 21–27",
    "Oct 28–Nov 3",
    "Nov 4–10",
    "Nov 11–17",
    "Nov 18–24",
    "Nov 25–Dec 1",
    "Dec 2–8",
    "Dec 9–15"
];
const THANKSGIVING_WEEK = 12;
const RAW = [
    [
        [
            "Yardies",
            "Decoupes",
            "x",
            1,
            2,
            1,
            3.7
        ],
        [
            "MetaMookDawgs",
            "Mutts",
            "d",
            1,
            2,
            2,
            8.4
        ],
        [
            "Eagles",
            "Champs",
            "d",
            1,
            2,
            3,
            10.7
        ],
        [
            "Green",
            "Popeyes",
            "d",
            1,
            2,
            4,
            12.1
        ],
        [
            "Savages",
            "Kings",
            "d",
            1,
            2,
            5,
            16.8
        ]
    ],
    [
        [
            "Popeyes",
            "Mutts",
            "x",
            1,
            2,
            1,
            5.7
        ],
        [
            "Savages",
            "Green",
            "d",
            1,
            2,
            2,
            8.7
        ],
        [
            "MetaMookDawgs",
            "Champs",
            "d",
            1,
            2,
            3,
            13.1
        ],
        [
            "Eagles",
            "Yardies",
            "d",
            1,
            2,
            4,
            22.6
        ],
        [
            "Kings",
            "Decoupes",
            "d",
            1,
            2,
            5,
            23.6
        ]
    ],
    [
        [
            "Mutts",
            "Yardies",
            "d",
            1,
            2,
            1,
            6.4
        ],
        [
            "Decoupes",
            "Popeyes",
            "d",
            1,
            2,
            2,
            7.4
        ],
        [
            "Savages",
            "Champs",
            "x",
            1,
            1,
            3,
            11.4
        ],
        [
            "Green",
            "Eagles",
            "x",
            1,
            1,
            4,
            12.4
        ],
        [
            "Kings",
            "MetaMookDawgs",
            "x",
            1,
            1,
            5,
            18.5
        ]
    ],
    [
        [
            "Popeyes",
            "Yardies",
            "x",
            1,
            1,
            1,
            9.1
        ],
        [
            "Champs",
            "Green",
            "x",
            1,
            2,
            2,
            9.7
        ],
        [
            "MetaMookDawgs",
            "Decoupes",
            "x",
            1,
            1,
            3,
            10.1
        ],
        [
            "Kings",
            "Savages",
            "d",
            2,
            2,
            4,
            16.8
        ],
        [
            "Eagles",
            "Mutts",
            "d",
            1,
            2,
            5,
            19.2
        ]
    ],
    [
        [
            "Popeyes",
            "Green",
            "d",
            2,
            2,
            1,
            12.1
        ],
        [
            "Savages",
            "Decoupes",
            "d",
            1,
            2,
            2,
            12.8
        ],
        [
            "Eagles",
            "MetaMookDawgs",
            "d",
            1,
            2,
            3,
            15.8
        ],
        [
            "Yardies",
            "Champs",
            "d",
            1,
            2,
            4,
            19.9
        ],
        [
            "Mutts",
            "Kings",
            "x",
            1,
            1,
            5,
            21.9
        ]
    ],
    [
        [
            "Decoupes",
            "Yardies",
            "x",
            2,
            2,
            1,
            3.7
        ],
        [
            "Popeyes",
            "MetaMookDawgs",
            "x",
            1,
            1,
            2,
            6.7
        ],
        [
            "Savages",
            "Eagles",
            "x",
            1,
            1,
            3,
            14.1
        ],
        [
            "Green",
            "Kings",
            "d",
            1,
            2,
            4,
            15.1
        ],
        [
            "Champs",
            "Mutts",
            "d",
            1,
            2,
            5,
            16.5
        ]
    ],
    [
        [
            "Mutts",
            "MetaMookDawgs",
            "d",
            2,
            2,
            1,
            8.4
        ],
        [
            "Champs",
            "Eagles",
            "d",
            2,
            2,
            2,
            10.7
        ],
        [
            "Decoupes",
            "Savages",
            "d",
            2,
            2,
            3,
            12.8
        ],
        [
            "Yardies",
            "Green",
            "x",
            1,
            1,
            4,
            17.2
        ],
        [
            "Kings",
            "Popeyes",
            "d",
            1,
            2,
            5,
            20.2
        ]
    ],
    [
        [
            "Mutts",
            "Popeyes",
            "x",
            2,
            2,
            1,
            5.7
        ],
        [
            "MetaMookDawgs",
            "Savages",
            "x",
            1,
            2,
            2,
            7.7
        ],
        [
            "Green",
            "Champs",
            "x",
            2,
            2,
            3,
            9.7
        ],
        [
            "Yardies",
            "Eagles",
            "d",
            2,
            2,
            4,
            22.6
        ],
        [
            "Decoupes",
            "Kings",
            "d",
            2,
            2,
            5,
            23.6
        ]
    ],
    [
        [
            "Mutts",
            "Savages",
            "x",
            1,
            1,
            1,
            11.1
        ],
        [
            "MetaMookDawgs",
            "Yardies",
            "d",
            1,
            2,
            2,
            11.8
        ],
        [
            "Champs",
            "Kings",
            "x",
            1,
            1,
            3,
            13.4
        ],
        [
            "Green",
            "Decoupes",
            "d",
            1,
            2,
            4,
            15.5
        ],
        [
            "Eagles",
            "Popeyes",
            "x",
            1,
            1,
            5,
            17.5
        ]
    ],
    [
        [
            "Savages",
            "MetaMookDawgs",
            "x",
            2,
            2,
            1,
            7.7
        ],
        [
            "Green",
            "Mutts",
            "x",
            1,
            1,
            2,
            13.8
        ],
        [
            "Champs",
            "Yardies",
            "d",
            2,
            2,
            3,
            19.9
        ],
        [
            "Popeyes",
            "Kings",
            "d",
            2,
            2,
            4,
            20.2
        ],
        [
            "Eagles",
            "Decoupes",
            "x",
            1,
            1,
            5,
            20.9
        ]
    ],
    [
        [
            "Savages",
            "Popeyes",
            "d",
            1,
            2,
            1,
            9.4
        ],
        [
            "Decoupes",
            "Green",
            "d",
            2,
            2,
            2,
            15.5
        ],
        [
            "MetaMookDawgs",
            "Eagles",
            "d",
            2,
            2,
            3,
            15.8
        ],
        [
            "Mutts",
            "Champs",
            "d",
            2,
            2,
            4,
            16.5
        ],
        [
            "Kings",
            "Yardies",
            "x",
            1,
            1,
            5,
            25.3
        ]
    ],
    [
        [
            "Decoupes",
            "Mutts",
            "x",
            1,
            1,
            1,
            4.7
        ],
        [
            "MetaMookDawgs",
            "Green",
            "x",
            1,
            1,
            2,
            10.4
        ],
        [
            "Kings",
            "Eagles",
            "x",
            1,
            2,
            3,
            11.7
        ],
        [
            "Yardies",
            "Savages",
            "x",
            1,
            1,
            4,
            14.5
        ],
        [
            "Champs",
            "Popeyes",
            "x",
            1,
            1,
            5,
            14.8
        ]
    ],
    [
        [
            "Popeyes",
            "Savages",
            "d",
            2,
            2,
            1,
            9.4
        ],
        [
            "Yardies",
            "MetaMookDawgs",
            "d",
            2,
            2,
            2,
            11.8
        ],
        [
            "Kings",
            "Green",
            "d",
            2,
            2,
            3,
            15.1
        ],
        [
            "Decoupes",
            "Champs",
            "x",
            1,
            1,
            4,
            18.2
        ],
        [
            "Mutts",
            "Eagles",
            "d",
            2,
            2,
            5,
            19.2
        ]
    ],
    [
        [
            "Yardies",
            "Mutts",
            "d",
            2,
            2,
            1,
            6.4
        ],
        [
            "Popeyes",
            "Decoupes",
            "d",
            2,
            2,
            2,
            7.4
        ],
        [
            "Green",
            "Savages",
            "d",
            2,
            2,
            3,
            8.7
        ],
        [
            "Eagles",
            "Kings",
            "x",
            2,
            2,
            4,
            11.7
        ],
        [
            "Champs",
            "MetaMookDawgs",
            "d",
            2,
            2,
            5,
            13.1
        ]
    ]
];
const SCHEDULE = RAW.map((week)=>week.map(([home, away, type, seriesGame, seriesLength, gameNumber, rating])=>({
            home: TEAMS[home],
            away: TEAMS[away],
            divisional: type === "d",
            seriesIndex: seriesGame,
            seriesTotal: seriesLength,
            rating,
            gotw: gameNumber === 1
        })));
function monogram(team) {
    return `${team.city[0] ?? ""}${team.name[0] ?? ""}`.toUpperCase();
}
function TeamCell({ team, align }) {
    const mark = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$EntityLogo$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EntityLogo"], {
        className: "wp-mark",
        color: team.color,
        logoUrl: team.logo,
        monogram: monogram(team),
        size: 32
    }, void 0, false, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
        lineNumber: 75,
        columnNumber: 16
    }, this);
    const name = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "wp-name",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                children: team.city
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                lineNumber: 78,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                children: team.name
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                lineNumber: 79,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "wp-record",
                children: "0-0"
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                lineNumber: 80,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
        lineNumber: 77,
        columnNumber: 5
    }, this);
    const rank = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
        className: "wp-seed",
        children: team.rank
    }, void 0, false, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
        lineNumber: 83,
        columnNumber: 16
    }, this);
    return align === "left" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "wp-team",
        children: [
            rank,
            mark,
            name
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
        lineNumber: 85,
        columnNumber: 7
    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "wp-team wp-right",
        children: [
            name,
            mark,
            rank
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
        lineNumber: 86,
        columnNumber: 7
    }, this);
}
function SchedulePreview() {
    const [week, setWeek] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(1);
    const games = SCHEDULE[week - 1];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "welcome-showcase-frame",
        role: "group",
        "aria-label": "Prodigies vs Esteemed FFL 2026 schedule — select a week to preview its matchups",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "welcome-showcase-bar",
                "aria-hidden": "true",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {}, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                        lineNumber: 94,
                        columnNumber: 65
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {}, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                        lineNumber: 94,
                        columnNumber: 72
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {}, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                        lineNumber: 94,
                        columnNumber: 79
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                lineNumber: 94,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "welcome-preview",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "wp-topline",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$EntityLogo$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EntityLogo"], {
                                className: "wp-league-mark",
                                color: LEAGUE.color,
                                logoUrl: LEAGUE.logo,
                                monogram: "PVE",
                                size: 32
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                                lineNumber: 97,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: LEAGUE.name
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                                lineNumber: 98,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "2026 · 14 weeks"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                                lineNumber: 99,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                        lineNumber: 96,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "wp-weeks",
                        role: "tablist",
                        "aria-label": "Schedule week",
                        children: SCHEDULE.map((_, index)=>{
                            const number = index + 1;
                            const isThanks = number === THANKSGIVING_WEEK;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                role: "tab",
                                "aria-selected": week === number,
                                title: isThanks ? "Thanksgiving week" : `Week ${number}`,
                                className: `${week === number ? "on" : ""}${isThanks ? " thanks" : ""}`,
                                onClick: ()=>setWeek(number),
                                children: [
                                    "W",
                                    number
                                ]
                            }, index, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                                lineNumber: 106,
                                columnNumber: 15
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                        lineNumber: 101,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "wp-weekhead",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                children: String(week).padStart(2, "0")
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                                lineNumber: 121,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: [
                                            "Week ",
                                            week,
                                            week === THANKSGIVING_WEEK ? " · Thanksgiving" : ""
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                                        lineNumber: 122,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                        children: [
                                            WEEK_DATES[week - 1],
                                            " · 2026"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                                        lineNumber: 122,
                                        columnNumber: 98
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                                lineNumber: 122,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("em", {
                                children: [
                                    games.length,
                                    " games"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                                lineNumber: 123,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                        lineNumber: 120,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "wp-rows",
                        children: games.map((game, index)=>{
                            const thanks = week === THANKSGIVING_WEEK && game.gotw;
                            const division = game.divisional ? DIVISIONS[game.home.division] : null;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `wp-row${game.gotw ? " is-gotw" : ""}${thanks ? " is-thanks" : ""}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "wp-rowhead",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                                className: "wp-gameno",
                                                children: [
                                                    "Game ",
                                                    index + 1
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                                                lineNumber: 132,
                                                columnNumber: 19
                                            }, this),
                                            game.gotw ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "wp-tag gotw",
                                                children: thanks ? "Thanksgiving Game" : "Game of the Week"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                                                lineNumber: 134,
                                                columnNumber: 21
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: `wp-tag${game.divisional ? " div" : ""}`,
                                                children: [
                                                    division && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                        className: "wp-divmark",
                                                        src: division.logo,
                                                        alt: "",
                                                        style: {
                                                            background: division.color
                                                        }
                                                    }, void 0, false, {
                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                                                        lineNumber: 137,
                                                        columnNumber: 36
                                                    }, this),
                                                    game.divisional ? `${division?.name} · ${game.seriesIndex} of ${game.seriesTotal}` : `Cross-division · ${game.seriesIndex} of ${game.seriesTotal}`
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                                                lineNumber: 136,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "wp-rating",
                                                title: `Matchup rating ${game.rating.toFixed(1)}`,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$column$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart3$3e$__["BarChart3"], {
                                                        "aria-hidden": "true"
                                                    }, void 0, false, {
                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                                                        lineNumber: 142,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                                        children: game.rating.toFixed(1)
                                                    }, void 0, false, {
                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                                                        lineNumber: 143,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                        children: [
                                                            "#",
                                                            game.home.rank,
                                                            " vs #",
                                                            game.away.rank
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                                                        lineNumber: 144,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                                                lineNumber: 141,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                                        lineNumber: 131,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "wp-match",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(TeamCell, {
                                                team: game.home,
                                                align: "left"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                                                lineNumber: 148,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "wp-center",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                        children: "SCHEDULED"
                                                    }, void 0, false, {
                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                                                        lineNumber: 150,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "wp-venue",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__["MapPin"], {
                                                                "aria-hidden": "true"
                                                            }, void 0, false, {
                                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                                                                lineNumber: 152,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                children: game.home.venue
                                                            }, void 0, false, {
                                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                                                                lineNumber: 153,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                                className: "wp-venue-mark",
                                                                src: game.home.logo,
                                                                alt: ""
                                                            }, void 0, false, {
                                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                                                                lineNumber: 154,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                                                        lineNumber: 151,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                                                lineNumber: 149,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(TeamCell, {
                                                team: game.away,
                                                align: "right"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                                                lineNumber: 157,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                                        lineNumber: 147,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, game.home.name + game.away.name, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                                lineNumber: 130,
                                columnNumber: 15
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                        lineNumber: 125,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
                lineNumber: 95,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/welcome/SchedulePreview.tsx",
        lineNumber: 93,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=_claude_worktrees_playoff-suite_87fd9984._.js.map