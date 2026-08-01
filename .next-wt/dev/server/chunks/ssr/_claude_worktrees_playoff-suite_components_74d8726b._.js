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
"[project]/.claude/worktrees/playoff-suite/components/ui/CustomSelect.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CustomSelect",
    ()=>CustomSelect
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$dom$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-dom.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/check.mjs [app-ssr] (ecmascript) <export default as Check>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.mjs [app-ssr] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$EntityLogo$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/components/ui/EntityLogo.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
function OptionIdentity({ option }) {
    if (!option.logoUrl && !option.swatch && !option.monogram) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$EntityLogo$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EntityLogo"], {
        className: "select-option-identity",
        color: option.swatch ?? "#117A45",
        logoUrl: option.logoUrl,
        monogram: option.monogram || option.label.slice(0, 3).toUpperCase()
    }, void 0, false, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/CustomSelect.tsx",
        lineNumber: 20,
        columnNumber: 5
    }, this);
}
function CustomSelect({ value, options, onChange, label, disabled = false, showSelectedDescription = true }) {
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [activeIndex, setActiveIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const [position, setPosition] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        left: 0,
        top: 0,
        width: 190,
        maxHeight: 250,
        ready: false
    });
    const menuId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useId"])();
    const root = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const trigger = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const menu = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const optionRefs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])([]);
    const selected = options.find((option)=>option.value === value) ?? options[0];
    const selectedIndex = Math.max(0, options.findIndex((option)=>option.value === selected.value));
    const optionId = (index)=>`${menuId}-option-${index}`;
    const choose = (optionValue)=>{
        onChange(optionValue);
        setOpen(false);
        trigger.current?.focus();
    };
    const openAt = (index)=>{
        setActiveIndex(index);
        setOpen(true);
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const close = (event)=>{
            const target = event.target;
            if (!root.current?.contains(target) && !menu.current?.contains(target)) setOpen(false);
        };
        document.addEventListener("mousedown", close);
        return ()=>document.removeEventListener("mousedown", close);
    }, []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!open) return;
        setActiveIndex(selectedIndex);
        const escape = (event)=>{
            if (event.key === "Escape") {
                setOpen(false);
                trigger.current?.focus();
            }
        };
        document.addEventListener("keydown", escape);
        return ()=>document.removeEventListener("keydown", escape);
    }, [
        open,
        selectedIndex
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!open) return;
        optionRefs.current[activeIndex]?.focus();
    }, [
        activeIndex,
        open
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLayoutEffect"])(()=>{
        if (!open) return;
        const update = ()=>{
            const triggerRect = trigger.current?.getBoundingClientRect();
            const menuElement = menu.current;
            if (!triggerRect || !menuElement) return;
            const gutter = 12;
            const gap = 5;
            const width = Math.min(Math.max(triggerRect.width, 190), window.innerWidth - gutter * 2);
            const left = Math.min(Math.max(gutter, triggerRect.left), Math.max(gutter, window.innerWidth - width - gutter));
            const below = window.innerHeight - triggerRect.bottom - gutter;
            const above = triggerRect.top - gutter;
            const placeBelow = below >= Math.min(menuElement.scrollHeight, 220) || below >= above;
            const maxHeight = Math.max(120, Math.min(320, placeBelow ? below - gap : above - gap));
            const top = placeBelow ? triggerRect.bottom + gap : Math.max(gutter, triggerRect.top - Math.min(menuElement.scrollHeight, maxHeight) - gap);
            setPosition({
                left,
                top,
                width,
                maxHeight,
                ready: true
            });
        };
        update();
        window.addEventListener("resize", update);
        window.addEventListener("scroll", update, true);
        return ()=>{
            window.removeEventListener("resize", update);
            window.removeEventListener("scroll", update, true);
        };
    }, [
        open,
        options.length
    ]);
    const onTriggerKeyDown = (event)=>{
        if (disabled) return;
        if ([
            "ArrowDown",
            "ArrowUp",
            "Home",
            "End"
        ].includes(event.key)) {
            event.preventDefault();
            const nextIndex = event.key === "ArrowUp" ? Math.max(0, selectedIndex - 1) : event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : Math.min(options.length - 1, selectedIndex + 1);
            openAt(nextIndex);
        }
    };
    const onMenuKeyDown = (event)=>{
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((current)=>Math.min(options.length - 1, current + 1));
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((current)=>Math.max(0, current - 1));
        } else if (event.key === "Home") {
            event.preventDefault();
            setActiveIndex(0);
        } else if (event.key === "End") {
            event.preventDefault();
            setActiveIndex(options.length - 1);
        } else if (event.key === "Tab") {
            setOpen(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "custom-select",
        ref: root,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                ref: trigger,
                type: "button",
                className: "custom-select-trigger",
                "aria-label": label,
                "aria-haspopup": "listbox",
                "aria-expanded": open,
                "aria-controls": open ? menuId : undefined,
                "aria-activedescendant": open ? optionId(activeIndex) : undefined,
                disabled: disabled,
                onClick: ()=>open ? setOpen(false) : openAt(selectedIndex),
                onKeyDown: onTriggerKeyDown,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(OptionIdentity, {
                        option: selected
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/CustomSelect.tsx",
                        lineNumber: 146,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: selected.label
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/CustomSelect.tsx",
                                lineNumber: 147,
                                columnNumber: 15
                            }, this),
                            showSelectedDescription && selected.description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                children: selected.description
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/CustomSelect.tsx",
                                lineNumber: 147,
                                columnNumber: 100
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/CustomSelect.tsx",
                        lineNumber: 147,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                        className: open ? "open" : ""
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/CustomSelect.tsx",
                        lineNumber: 148,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/CustomSelect.tsx",
                lineNumber: 145,
                columnNumber: 7
            }, this),
            open && !disabled && typeof document !== "undefined" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$dom$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createPortal"])(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: menu,
                id: menuId,
                className: "custom-select-menu",
                role: "listbox",
                "aria-label": label,
                "aria-activedescendant": optionId(activeIndex),
                onKeyDown: onMenuKeyDown,
                style: {
                    left: position.left,
                    top: position.top,
                    width: position.width,
                    maxHeight: position.maxHeight,
                    visibility: position.ready ? "visible" : "hidden"
                },
                children: options.map((option, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        ref: (node)=>{
                            optionRefs.current[index] = node;
                        },
                        id: optionId(index),
                        type: "button",
                        role: "option",
                        "aria-selected": option.value === value,
                        "data-active": index === activeIndex ? "true" : undefined,
                        onClick: ()=>choose(option.value),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(OptionIdentity, {
                                option: option
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/CustomSelect.tsx",
                                lineNumber: 154,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: option.label
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/CustomSelect.tsx",
                                        lineNumber: 155,
                                        columnNumber: 21
                                    }, this),
                                    option.description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                        children: option.description
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/CustomSelect.tsx",
                                        lineNumber: 155,
                                        columnNumber: 75
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/CustomSelect.tsx",
                                lineNumber: 155,
                                columnNumber: 15
                            }, this),
                            option.value === value && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {}, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/CustomSelect.tsx",
                                lineNumber: 156,
                                columnNumber: 42
                            }, this)
                        ]
                    }, option.value, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/CustomSelect.tsx",
                        lineNumber: 153,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/CustomSelect.tsx",
                lineNumber: 151,
                columnNumber: 9
            }, this), document.body)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/CustomSelect.tsx",
        lineNumber: 144,
        columnNumber: 5
    }, this);
}
}),
"[project]/.claude/worktrees/playoff-suite/components/ui/ColorField.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ColorField",
    ()=>ColorField
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
// A self-contained custom color control — a saturation/brightness field, a hue slider and a
// validated hex input — replacing the native <input type="color"> (an inconsistent, off-brand
// OS dialog). A hue slider alone can't reach every color (it locks saturation and lightness to
// the starting swatch), so the 2D field gives full control. Color maths are kept local so this
// stays drop-in and dependency-free.
function normalizeHex(value) {
    const v = value.trim().replace(/^#/, "");
    if (/^[0-9a-fA-F]{6}$/.test(v)) return `#${v.toUpperCase()}`;
    if (/^[0-9a-fA-F]{3}$/.test(v)) return `#${v.split("").map((c)=>c + c).join("").toUpperCase()}`;
    return null;
}
function hexToRgb(hex) {
    const v = hex.replace("#", "");
    return {
        r: parseInt(v.slice(0, 2), 16),
        g: parseInt(v.slice(2, 4), 16),
        b: parseInt(v.slice(4, 6), 16)
    };
}
function rgbToHex(r, g, b) {
    return `#${[
        r,
        g,
        b
    ].map((n)=>Math.round(n).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}
function rgbToHsv({ r, g, b }) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    if (d !== 0) {
        if (max === r) h = (g - b) / d % 6;
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
        if (h < 0) h += 360;
    }
    return {
        h,
        s: max === 0 ? 0 : d / max,
        v: max
    };
}
function hsvToHex(h, s, v) {
    const c = v * s;
    const x = c * (1 - Math.abs(h / 60 % 2 - 1));
    const m = v - c;
    let r = 0, g = 0, b = 0;
    if (h < 60) [r, g, b] = [
        c,
        x,
        0
    ];
    else if (h < 120) [r, g, b] = [
        x,
        c,
        0
    ];
    else if (h < 180) [r, g, b] = [
        0,
        c,
        x
    ];
    else if (h < 240) [r, g, b] = [
        0,
        x,
        c
    ];
    else if (h < 300) [r, g, b] = [
        x,
        0,
        c
    ];
    else [r, g, b] = [
        c,
        0,
        x
    ];
    return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}
const clamp01 = (n)=>Math.min(1, Math.max(0, n));
function ColorField({ value, onChange }) {
    const [text, setText] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(value.replace(/^#/, "").toUpperCase());
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        setText(value.replace(/^#/, "").toUpperCase());
    }, [
        value
    ]);
    const { h, s, v } = rgbToHsv(hexToRgb(value));
    const hue = Math.round(h);
    const areaRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const commitHex = (next)=>{
        setText(next.replace(/^#/, "").toUpperCase());
        const normalized = normalizeHex(next);
        if (normalized) onChange(normalized);
    };
    const applyFromPointer = (clientX, clientY)=>{
        const rect = areaRef.current?.getBoundingClientRect();
        if (!rect) return;
        const nextS = clamp01((clientX - rect.left) / rect.width);
        const nextV = clamp01(1 - (clientY - rect.top) / rect.height);
        onChange(hsvToHex(hue, nextS, nextV));
    };
    const startDrag = (event)=>{
        event.preventDefault();
        areaRef.current?.focus();
        applyFromPointer(event.clientX, event.clientY);
        const move = (e)=>applyFromPointer(e.clientX, e.clientY);
        const stop = ()=>{
            document.removeEventListener("pointermove", move);
            document.removeEventListener("pointerup", stop);
        };
        document.addEventListener("pointermove", move);
        document.addEventListener("pointerup", stop);
    };
    // Arrow keys nudge saturation (left/right) and brightness (up/down) for keyboard users.
    const nudge = (event)=>{
        const step = event.shiftKey ? 0.1 : 0.02;
        let nextS = s, nextV = v;
        if (event.key === "ArrowLeft") nextS = clamp01(s - step);
        else if (event.key === "ArrowRight") nextS = clamp01(s + step);
        else if (event.key === "ArrowUp") nextV = clamp01(v + step);
        else if (event.key === "ArrowDown") nextV = clamp01(v - step);
        else return;
        event.preventDefault();
        onChange(hsvToHex(hue, nextS, nextV));
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "color-field",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: areaRef,
                className: "color-field-area",
                style: {
                    "--sv-base": hsvToHex(hue, 1, 1)
                },
                onPointerDown: startDrag,
                onKeyDown: nudge,
                role: "slider",
                tabIndex: 0,
                "aria-label": "Saturation and brightness",
                "aria-valuetext": `Saturation ${Math.round(s * 100)}%, brightness ${Math.round(v * 100)}%`,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "color-field-area-thumb",
                    style: {
                        left: `${s * 100}%`,
                        top: `${(1 - v) * 100}%`,
                        background: value
                    }
                }, void 0, false, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/ColorField.tsx",
                    lineNumber: 118,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/ColorField.tsx",
                lineNumber: 107,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                type: "range",
                className: "color-field-hue",
                min: 0,
                max: 360,
                value: hue,
                "aria-label": "Hue",
                onChange: (event)=>onChange(hsvToHex(Number(event.target.value), s, v)),
                style: {
                    "--hue-thumb": value
                }
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/ColorField.tsx",
                lineNumber: 120,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "color-field-top",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "color-field-preview",
                        style: {
                            background: value
                        },
                        "aria-hidden": "true"
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/ColorField.tsx",
                        lineNumber: 131,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "color-field-hex",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                "aria-hidden": "true",
                                children: "#"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/ColorField.tsx",
                                lineNumber: 133,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                value: text,
                                maxLength: 7,
                                spellCheck: false,
                                autoComplete: "off",
                                "aria-label": "Hex color value",
                                onChange: (event)=>commitHex(event.target.value)
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/ColorField.tsx",
                                lineNumber: 134,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/ColorField.tsx",
                        lineNumber: 132,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/ColorField.tsx",
                lineNumber: 130,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/ColorField.tsx",
        lineNumber: 106,
        columnNumber: 5
    }, this);
}
}),
"[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "IdentityColorPicker",
    ()=>IdentityColorPicker
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$dom$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-dom.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-alert.mjs [app-ssr] (ecmascript) <export default as AlertCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$image$2d$plus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ImagePlus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/image-plus.mjs [app-ssr] (ecmascript) <export default as ImagePlus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LoaderCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.mjs [app-ssr] (ecmascript) <export default as LoaderCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$palette$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Palette$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/palette.mjs [app-ssr] (ecmascript) <export default as Palette>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pipette$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Pipette$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/pipette.mjs [app-ssr] (ecmascript) <export default as Pipette>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trash-2.mjs [app-ssr] (ecmascript) <export default as Trash2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.mjs [app-ssr] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$imageColors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/imageColors.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$colorContrast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/colorContrast.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$ColorField$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/components/ui/ColorField.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$Tooltip$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/components/ui/Tooltip.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
;
const EMPTY_COLOR_SUGGESTIONS = [];
// Shown when a team has no logo to pull colors from (e.g. every CSV/paste import). Six
// distinct hues — the old fallback repeated the same blue twice and wasted a slot.
const DEFAULT_COLOR_CHOICES = [
    "#117A45",
    "#E3B940",
    "#2457A7",
    "#B42318",
    "#6D28D9",
    "#0369A1"
];
const IDENTITY_COLOR_MENU_EVENT = "leagueweaver:identity-color-menu-open";
function IdentityColorPicker({ name, abbreviation, color, logoUrl, colorSuggestions = EMPTY_COLOR_SUGGESTIONS, onChange, compact = false, showColorControl = true, showAbbreviation = true, imagePresentation = "tinted" }) {
    const inputId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useId"])();
    const menuId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useId"])();
    const [suggestions, setSuggestions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [busy, setBusy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [draftColor, setDraftColor] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(color);
    const [failedLogo, setFailedLogo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [menuPosition, setMenuPosition] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        top: 0,
        left: 0,
        placement: "below",
        arrowLeft: 24
    });
    const [pickMode, setPickMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [pickerError, setPickerError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const paletteRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const menuRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const canvasRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const visibleLogo = logoUrl && failedLogo !== logoUrl ? logoUrl : undefined;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        setSuggestions(colorSuggestions);
    }, [
        colorSuggestions
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (open) setDraftColor(color);
    }, [
        color,
        open
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const closeOtherMenu = (event)=>{
            const detail = event.detail;
            if (detail?.id !== menuId) setOpen(false);
        };
        window.addEventListener(IDENTITY_COLOR_MENU_EVENT, closeOtherMenu);
        return ()=>window.removeEventListener(IDENTITY_COLOR_MENU_EVENT, closeOtherMenu);
    }, [
        menuId
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!open) return;
        const onPointerDown = (event)=>{
            const target = event.target;
            if (!target || menuRef.current?.contains(target) || paletteRef.current?.contains(target)) return;
            setOpen(false);
        };
        const onKeyDown = (event)=>{
            if (event.key === "Escape") {
                setOpen(false);
                paletteRef.current?.focus();
            }
        };
        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return ()=>{
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [
        open
    ]);
    const upload = async (file)=>{
        if (!file) return;
        setBusy(true);
        try {
            const analyzed = await (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$imageColors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["analyzeIdentityImage"])(file);
            if (showColorControl) setSuggestions(analyzed.colors);
            onChange({
                logoUrl: analyzed.logoUrl,
                color: analyzed.colors[0]
            });
            if (showColorControl) {
                window.dispatchEvent(new CustomEvent(IDENTITY_COLOR_MENU_EVENT, {
                    detail: {
                        id: menuId
                    }
                }));
                setOpen(true);
            }
        } finally{
            setBusy(false);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLayoutEffect"])(()=>{
        if (!open) return;
        const updatePosition = ()=>{
            const rect = paletteRef.current?.getBoundingClientRect();
            if (!rect) return;
            const menuWidth = menuRef.current?.offsetWidth || 326;
            const menuHeight = menuRef.current?.offsetHeight || 360;
            const maxLeft = Math.max(12, window.innerWidth - menuWidth - 12);
            const maxTop = Math.max(12, window.innerHeight - menuHeight - 12);
            const gap = 9;
            const belowTop = rect.bottom + gap;
            const aboveTop = rect.top - menuHeight - gap;
            const placeBelow = belowTop <= maxTop;
            const top = Math.max(12, Math.min(maxTop, placeBelow ? belowTop : aboveTop));
            const left = Math.max(12, Math.min(maxLeft, rect.left - 4));
            // Point the arrow at the trigger's centre, clamped so it stays on the popover.
            const arrowLeft = Math.max(16, Math.min(menuWidth - 16, rect.left + rect.width / 2 - left));
            setMenuPosition({
                top,
                left,
                placement: placeBelow ? "below" : "above",
                arrowLeft
            });
        };
        updatePosition();
        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);
        return ()=>{
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
        };
    }, [
        open,
        pickMode,
        suggestions.length
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!open || !pickMode || !visibleLogo) return;
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d", {
            willReadFrequently: true
        });
        if (!canvas || !context) return;
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = ()=>{
            const width = 260;
            const height = 180;
            const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
            const drawWidth = Math.max(1, Math.round(image.naturalWidth * scale));
            const drawHeight = Math.max(1, Math.round(image.naturalHeight * scale));
            const offsetX = Math.round((width - drawWidth) / 2);
            const offsetY = Math.round((height - drawHeight) / 2);
            canvas.width = width;
            canvas.height = height;
            canvas.dataset.offsetX = String(offsetX);
            canvas.dataset.offsetY = String(offsetY);
            canvas.dataset.drawWidth = String(drawWidth);
            canvas.dataset.drawHeight = String(drawHeight);
            context.clearRect(0, 0, width, height);
            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, width, height);
            context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
            setPickerError("");
        };
        image.onerror = ()=>setPickerError("This logo could not be opened for color picking.");
        image.src = visibleLogo.startsWith("http") ? `/api/image-proxy?url=${encodeURIComponent(visibleLogo)}` : visibleLogo;
    }, [
        open,
        pickMode,
        visibleLogo
    ]);
    const pickCanvasColor = (event)=>{
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d", {
            willReadFrequently: true
        });
        if (!canvas || !context) return;
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) * (canvas.width / rect.width));
        const y = Math.floor((event.clientY - rect.top) * (canvas.height / rect.height));
        const offsetX = Number(canvas.dataset.offsetX || "0");
        const offsetY = Number(canvas.dataset.offsetY || "0");
        const drawWidth = Number(canvas.dataset.drawWidth || canvas.width);
        const drawHeight = Number(canvas.dataset.drawHeight || canvas.height);
        if (x < offsetX || y < offsetY || x > offsetX + drawWidth || y > offsetY + drawHeight) return;
        const [red, green, blue] = context.getImageData(x, y, 1, 1).data;
        setDraftColor(`#${[
            red,
            green,
            blue
        ].map((value)=>value.toString(16).padStart(2, "0")).join("").toUpperCase()}`);
    };
    const colorMenu = showColorControl && open ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "identity-color-popover",
        "data-placement": menuPosition.placement,
        style: {
            top: menuPosition.top,
            left: menuPosition.left
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "identity-color-arrow",
                style: {
                    left: menuPosition.arrowLeft
                },
                "aria-hidden": "true"
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                lineNumber: 177,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: menuRef,
                className: "identity-color-menu",
                role: "group",
                "aria-label": `Choose ${name} color`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: suggestions.length ? "Colors from logo" : "Team color"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                                lineNumber: 179,
                                columnNumber: 14
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                "aria-label": "Close color selector",
                                onClick: ()=>setOpen(false),
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {}, void 0, false, {
                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                                    lineNumber: 179,
                                    columnNumber: 174
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                                lineNumber: 179,
                                columnNumber: 87
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                        lineNumber: 179,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: suggestions.length ? "Tap a logo color, tweak the hue, or type a hex." : "Tap a swatch, tweak the hue, or type a hex."
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                        lineNumber: 180,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "suggested-swatches",
                        children: [
                            suggestions.map((suggestion, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    "aria-label": `Preview image color ${index + 1}: ${suggestion}`,
                                    className: draftColor.toUpperCase() === suggestion.toUpperCase() ? "active" : "",
                                    style: {
                                        background: suggestion
                                    },
                                    onClick: ()=>setDraftColor(suggestion)
                                }, `${suggestion}-${index}`, false, {
                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                                    lineNumber: 182,
                                    columnNumber: 51
                                }, this)),
                            !suggestions.length && DEFAULT_COLOR_CHOICES.map((suggestion, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    "aria-label": `Use color ${index + 1}: ${suggestion}`,
                                    className: draftColor.toUpperCase() === suggestion.toUpperCase() ? "active" : "",
                                    style: {
                                        background: suggestion
                                    },
                                    onClick: ()=>setDraftColor(suggestion)
                                }, `${suggestion}-${index}`, false, {
                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                                    lineNumber: 183,
                                    columnNumber: 84
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                        lineNumber: 181,
                        columnNumber: 9
                    }, this),
                    !pickMode && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$ColorField$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ColorField"], {
                        value: draftColor,
                        onChange: (hex)=>setDraftColor(hex)
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                        lineNumber: 185,
                        columnNumber: 23
                    }, this),
                    visibleLogo && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: `logo-picker-toggle ${pickMode ? "active" : ""}`,
                        "aria-pressed": pickMode,
                        onClick: ()=>setPickMode((current)=>!current),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pipette$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Pipette$3e$__["Pipette"], {}, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                                lineNumber: 186,
                                columnNumber: 183
                            }, this),
                            "Pick color from logo"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                        lineNumber: 186,
                        columnNumber: 25
                    }, this),
                    pickMode && visibleLogo && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "logo-color-picker",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "logo-color-stage",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                                    ref: canvasRef,
                                    onClick: pickCanvasColor,
                                    "aria-label": "Pick a color from the logo"
                                }, void 0, false, {
                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                                    lineNumber: 188,
                                    columnNumber: 45
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                                lineNumber: 188,
                                columnNumber: 11
                            }, this),
                            pickerError ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "logo-color-error",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {}, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                                        lineNumber: 190,
                                        columnNumber: 50
                                    }, this),
                                    pickerError
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                                lineNumber: 190,
                                columnNumber: 15
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "logo-color-hint",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pipette$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Pipette$3e$__["Pipette"], {}, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                                        lineNumber: 191,
                                        columnNumber: 46
                                    }, this),
                                    "Click anywhere on the logo to sample that exact color."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                                lineNumber: 191,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "logo-remove-btn",
                                "aria-label": `Remove ${name} logo`,
                                onClick: ()=>{
                                    onChange({
                                        logoUrl: ""
                                    });
                                    setSuggestions([]);
                                    setFailedLogo(null);
                                    setPickMode(false);
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {}, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                                        lineNumber: 192,
                                        columnNumber: 204
                                    }, this),
                                    "Remove logo"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                                lineNumber: 192,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                        lineNumber: 187,
                        columnNumber: 37
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "confirm-color",
                        onClick: ()=>{
                            onChange({
                                color: draftColor
                            });
                            setOpen(false);
                        },
                        children: "Use this color"
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                        lineNumber: 194,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                lineNumber: 178,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
        lineNumber: 176,
        columnNumber: 5
    }, this) : null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `identity-picker ${compact ? "identity-picker-compact" : ""}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                id: inputId,
                className: "sr-only",
                type: "file",
                accept: "image/png,image/jpeg,image/webp",
                onChange: (event)=>upload(event.target.files?.[0])
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                lineNumber: 201,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$Tooltip$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Tooltip"], {
                label: visibleLogo ? `Change ${name} logo` : `Upload ${name} logo`,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                    className: `identity-logo-button ${visibleLogo && imagePresentation === "bare" ? "identity-logo-button-bare" : ""}`,
                    htmlFor: inputId,
                    style: compact ? {
                        background: visibleLogo && imagePresentation === "bare" ? "transparent" : visibleLogo ? (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$colorContrast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tintColor"])(color) : color,
                        borderColor: color,
                        color: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$colorContrast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["readableTextColor"])(color)
                    } : undefined,
                    children: busy ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LoaderCircle$3e$__["LoaderCircle"], {
                        className: "spin"
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                        lineNumber: 204,
                        columnNumber: 19
                    }, this) : visibleLogo ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                        src: visibleLogo,
                        alt: "",
                        onError: ()=>setFailedLogo(visibleLogo)
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                        lineNumber: 204,
                        columnNumber: 69
                    }, this) : compact ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$image$2d$plus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ImagePlus$3e$__["ImagePlus"], {}, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                        lineNumber: 204,
                        columnNumber: 157
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$image$2d$plus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ImagePlus$3e$__["ImagePlus"], {}, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                                lineNumber: 204,
                                columnNumber: 175
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: [
                                            "Add ",
                                            name.toLowerCase(),
                                            " logo"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                                        lineNumber: 204,
                                        columnNumber: 194
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                        children: "We’ll pull its top three colors"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                                        lineNumber: 204,
                                        columnNumber: 240
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                                lineNumber: 204,
                                columnNumber: 188
                            }, this)
                        ]
                    }, void 0, true)
                }, void 0, false, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                    lineNumber: 203,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                lineNumber: 202,
                columnNumber: 7
            }, this),
            compact && showAbbreviation && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "identity-name",
                children: abbreviation
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                lineNumber: 207,
                columnNumber: 39
            }, this),
            showColorControl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$Tooltip$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Tooltip"], {
                label: `Choose ${name} color`,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    ref: paletteRef,
                    type: "button",
                    className: "identity-palette-toggle",
                    "aria-label": `Choose ${name} color`,
                    onClick: ()=>{
                        const next = !open;
                        // Telling the other pickers to close is a side effect, so it belongs in the event
                        // handler — not inside the setOpen updater, which must stay pure. Dispatching there
                        // synchronously set state on sibling pickers mid-render (the console warning).
                        if (next) window.dispatchEvent(new CustomEvent(IDENTITY_COLOR_MENU_EVENT, {
                            detail: {
                                id: menuId
                            }
                        }));
                        setOpen(next);
                    },
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: {
                            background: color,
                            color: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$colorContrast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["readableTextColor"])(color)
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$palette$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Palette$3e$__["Palette"], {}, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                            lineNumber: 216,
                            columnNumber: 81
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                        lineNumber: 216,
                        columnNumber: 12
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                    lineNumber: 209,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
                lineNumber: 208,
                columnNumber: 28
            }, this),
            colorMenu && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$dom$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createPortal"])(colorMenu, document.body)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx",
        lineNumber: 200,
        columnNumber: 5
    }, this);
}
}),
"[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ImportLeagueModal",
    ()=>ImportLeagueModal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-alert.mjs [app-ssr] (ecmascript) <export default as AlertCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-left.mjs [app-ssr] (ecmascript) <export default as ArrowLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/check.mjs [app-ssr] (ecmascript) <export default as Check>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.mjs [app-ssr] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$down$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/file-down.mjs [app-ssr] (ecmascript) <export default as FileDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$spreadsheet$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileSpreadsheet$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/file-spreadsheet.mjs [app-ssr] (ecmascript) <export default as FileSpreadsheet>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$question$2d$mark$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__HelpCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-question-mark.mjs [app-ssr] (ecmascript) <export default as HelpCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LoaderCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.mjs [app-ssr] (ecmascript) <export default as LoaderCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/plus.mjs [app-ssr] (ecmascript) <export default as Plus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/refresh-cw.mjs [app-ssr] (ecmascript) <export default as RefreshCw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldCheck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield-check.mjs [app-ssr] (ecmascript) <export default as ShieldCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/sparkles.mjs [app-ssr] (ecmascript) <export default as Sparkles>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trash-2.mjs [app-ssr] (ecmascript) <export default as Trash2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trash.mjs [app-ssr] (ecmascript) <export default as Trash>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/upload.mjs [app-ssr] (ecmascript) <export default as Upload>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.mjs [app-ssr] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$Modal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/components/ui/Modal.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$CustomSelect$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/components/ui/CustomSelect.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$IdentityColorPicker$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$apiErrors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/apiErrors.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$colorContrast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/colorContrast.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
;
const TEAM_COLORS = [
    "#B91C1C",
    "#1D4ED8",
    "#7C3AED",
    "#C2410C",
    "#047857",
    "#BE185D",
    "#0369A1",
    "#4D7C0F",
    "#A16207",
    "#4338CA",
    "#0F766E",
    "#9F1239",
    "#6D28D9",
    "#166534",
    "#1E40AF",
    "#854D0E"
];
const ESPN_IMPORT_HISTORY_KEY = "leagueweaver:v3:espn-imports";
const MAX_PASTE_IMPORT_CHARS = 50_000;
const MAX_IMPORT_TEAMS = 16;
const CSV_TEMPLATE = "City,Team,Manager,Division,Rank,Venue,Color\n,,,,,,\n,,,,,,";
const SAMPLE_ROSTER = [
    "City,Team,Manager,Division,Rank,Venue,Color",
    "Brooklyn,Sunday Architects,Anthony,North,1,Foundry Field,#B91C1C",
    "Chicago,Fourth & Forever,Riley,North,2,The Yard,#1D4ED8",
    "Seattle,Red Zone Society,Morgan,North,3,Victory Grounds,#7C3AED",
    "Baltimore,Blitz Department,Casey,North,4,The Gridiron,#C2410C",
    "Denver,Waiver Wire Works,Jordan,North,5,Summit Field,#047857",
    "Austin,Goal Line Guild,Sam,South,6,Union Stadium,#BE185D",
    "Phoenix,Gridiron Union,Alex,South,7,Commission Park,#0369A1",
    "Nashville,Huddle House,Drew,South,8,Music Row,#4D7C0F",
    "Dallas,Sunday Sailors,Pat,South,9,Star Field,#A16207",
    "Miami,Tide Turners,Lee,South,10,Palm Bowl,#4338CA"
].join("\n");
function detectRosterShape(value) {
    const lines = value.split(/\r?\n/).map((line)=>line.trim()).filter(Boolean);
    if (!lines.length) return {
        count: 0,
        hasHeader: false
    };
    const firstCells = lines[0].split(/\t|,/).map((cell)=>cell.trim().toLowerCase());
    const hasHeader = firstCells.some((cell)=>[
            "city",
            "team",
            "team name",
            "manager",
            "owner",
            "division",
            "rank",
            "stadium",
            "venue",
            "color",
            "colour",
            "hex"
        ].includes(cell));
    return {
        count: Math.min(hasHeader ? lines.length - 1 : lines.length, MAX_IMPORT_TEAMS),
        hasHeader
    };
}
function downloadCsvTemplate() {
    if (typeof document === "undefined") return;
    const anchor = document.createElement("a");
    anchor.href = `data:text/csv;charset=utf-8,${encodeURIComponent(CSV_TEMPLATE)}`;
    anchor.download = "league-weaver-roster-template.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
}
const SOURCE_META = {
    sleeper: {
        title: "Import from Sleeper",
        description: "Use a league ID or Sleeper username. No password needed.",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
            src: "/providers/sleeper.png",
            alt: ""
        }, void 0, false, {
            fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
            lineNumber: 52,
            columnNumber: 123
        }, ("TURBOPACK compile-time value", void 0))
    },
    espn: {
        title: "Connect ESPN",
        description: "Paste your public league URL or ID. No password needed.",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
            src: "/providers/espn.png",
            alt: ""
        }, void 0, false, {
            fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
            lineNumber: 53,
            columnNumber: 112
        }, ("TURBOPACK compile-time value", void 0))
    },
    csv: {
        title: "Import CSV roster",
        description: "Paste rows from a spreadsheet. Headers are optional.",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$spreadsheet$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileSpreadsheet$3e$__["FileSpreadsheet"], {}, void 0, false, {
            fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
            lineNumber: 54,
            columnNumber: 113
        }, ("TURBOPACK compile-time value", void 0))
    },
    paste: {
        title: "Paste a team list",
        description: "Use one team per line or comma-separated rows.",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$spreadsheet$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileSpreadsheet$3e$__["FileSpreadsheet"], {}, void 0, false, {
            fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
            lineNumber: 55,
            columnNumber: 109
        }, ("TURBOPACK compile-time value", void 0))
    },
    screenshot: {
        title: "Import a screenshot",
        description: "Upload a clear league or weekly-score screenshot, then review every result.",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__["Upload"], {}, void 0, false, {
            fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
            lineNumber: 56,
            columnNumber: 145
        }, ("TURBOPACK compile-time value", void 0))
    }
};
function loadSavedEspnImports() {
    if ("TURBOPACK compile-time truthy", 1) return [];
    //TURBOPACK unreachable
    ;
}
function saveEspnImport(identifier, preview) {
    if ("TURBOPACK compile-time truthy", 1) return [];
    //TURBOPACK unreachable
    ;
    const divisions = undefined;
    const saved = undefined;
    const next = undefined;
}
function readImage(file) {
    return new Promise((resolve, reject)=>{
        const reader = new FileReader();
        reader.onload = ()=>resolve(String(reader.result));
        reader.onerror = ()=>reject(new Error("We couldn't read that image."));
        reader.readAsDataURL(file);
    });
}
function parsePastedRoster(value, provider) {
    const warnings = [];
    if (value.length > MAX_PASTE_IMPORT_CHARS) {
        warnings.push("Only the first 50,000 characters were reviewed. Paste 8–16 team rows for the cleanest import.");
    }
    const lines = value.slice(0, MAX_PASTE_IMPORT_CHARS).split(/\r?\n/).map((line)=>line.trim()).filter(Boolean);
    const firstCells = lines[0]?.split(/\t|,/).map((cell)=>cell.trim().toLowerCase()) ?? [];
    const hasHeader = firstCells.some((cell)=>[
            "city",
            "team",
            "team name",
            "manager",
            "owner",
            "division",
            "rank",
            "stadium",
            "venue",
            "color",
            "colour",
            "hex"
        ].includes(cell));
    const headers = hasHeader ? firstCells : [];
    const dataLines = (hasHeader ? lines.slice(1) : lines).slice(0, MAX_IMPORT_TEAMS);
    if ((hasHeader ? lines.slice(1) : lines).length > MAX_IMPORT_TEAMS) {
        warnings.push("Only the first 16 team rows were imported. League Weaver supports 8–16 teams.");
    }
    const names = new Map();
    const teams = dataLines.map((line, index)=>{
        const cells = line.split(/\t|,/).map((cell)=>cell.trim());
        const at = (names, fallback)=>{
            const headerIndex = headers.findIndex((header)=>names.includes(header));
            return cells[headerIndex >= 0 ? headerIndex : fallback] ?? "";
        };
        const name = (at([
            "team",
            "team name"
        ], 0) || `Team ${index + 1}`).slice(0, 80);
        const duplicateKey = name.trim().toLowerCase();
        if (duplicateKey) names.set(duplicateKey, (names.get(duplicateKey) ?? 0) + 1);
        // Colour is header-only (never positional) and validated as a 6-digit hex; anything else
        // falls back to a distinct default so a stray value can't blank a team's colour.
        const colorCell = at([
            "color",
            "colour",
            "hex"
        ], -1).trim().replace(/^#/, "");
        const color = /^[0-9a-fA-F]{6}$/.test(colorCell) ? `#${colorCell.toUpperCase()}` : TEAM_COLORS[index % TEAM_COLORS.length];
        return {
            providerId: `${provider}-${index + 1}`,
            city: (hasHeader ? at([
                "city",
                "location"
            ], -1) : "").slice(0, 60),
            name,
            manager: at([
                "manager",
                "owner"
            ], 1).slice(0, 80),
            division: at([
                "division"
            ], 2).slice(0, 60),
            rank: Number(at([
                "rank",
                "overall rank"
            ], 3)) || index + 1,
            stadium: at([
                "stadium",
                "venue"
            ], 4).slice(0, 90),
            color
        };
    });
    const duplicateNames = [
        ...names.entries()
    ].filter(([, count])=>count > 1).map(([name])=>name);
    if (duplicateNames.length) warnings.push(`Duplicate team names found: ${duplicateNames.slice(0, 3).join(", ")}. Rename duplicates before confirming.`);
    return {
        provider,
        teams,
        hasPriorSeasonRanks: hasHeader && headers.some((header)=>[
                "rank",
                "overall rank"
            ].includes(header)),
        warnings: hasHeader ? warnings : [
            "No headers were found, so columns were read as team, manager, division, rank, and venue.",
            ...warnings
        ],
        requiresConfirmation: true
    };
}
function cleanDivisionName(value) {
    return value?.replace(/\s+division$/i, "").trim() || "";
}
function TeamPreviewRow({ team, index, source, expanded, duplicate, onToggle, onChange, onRemove, canRemove }) {
    const abbreviation = team.name.split(/\s+/).filter(Boolean).slice(0, 3).map((word)=>word[0]).join("").toUpperCase() || `T${index + 1}`;
    const showVenue = source !== "espn";
    const division = cleanDivisionName(team.division);
    const problem = !team.name.trim() ? "Needs a name" : duplicate ? "Duplicate" : null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `import-review-row${expanded ? " is-open" : ""}${problem ? " has-problem" : ""}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                className: "import-review-toggle",
                "aria-expanded": expanded,
                "aria-label": `${expanded ? "Collapse" : "Edit"} ${team.name || `team ${index + 1}`}`,
                onClick: onToggle,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "import-review-swatch",
                        style: {
                            background: team.color ?? TEAM_COLORS[index % TEAM_COLORS.length]
                        },
                        children: team.logoUrl ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                            src: team.logoUrl,
                            alt: ""
                        }, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                            lineNumber: 174,
                            columnNumber: 142
                        }, this) : abbreviation
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                        lineNumber: 174,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "import-review-summary-text",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: team.name || `Team ${index + 1}`
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 175,
                                columnNumber: 54
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                children: [
                                    division || "No division",
                                    team.manager || "No manager"
                                ].join(" · ")
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 175,
                                columnNumber: 105
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                        lineNumber: 175,
                        columnNumber: 9
                    }, this),
                    problem && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "import-review-flag",
                        children: problem
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                        lineNumber: 176,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                        className: "import-review-chev",
                        "aria-hidden": "true"
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                        lineNumber: 177,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                lineNumber: 173,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "import-review-fields",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "import-review-identity",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Logo & color"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 180,
                                columnNumber: 49
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$IdentityColorPicker$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["IdentityColorPicker"], {
                                compact: true,
                                showAbbreviation: false,
                                name: team.name,
                                abbreviation: abbreviation,
                                color: team.color ?? TEAM_COLORS[index % TEAM_COLORS.length],
                                colorSuggestions: team.colorSuggestions,
                                logoUrl: team.logoUrl,
                                onChange: (identity)=>onChange({
                                        ...team,
                                        ...identity
                                    })
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 180,
                                columnNumber: 78
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                        lineNumber: 180,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "City"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 181,
                                columnNumber: 16
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                "aria-label": `Imported team ${index + 1} city`,
                                value: team.city ?? "",
                                placeholder: "City",
                                onChange: (event)=>onChange({
                                        ...team,
                                        city: event.target.value
                                    })
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 181,
                                columnNumber: 33
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                        lineNumber: 181,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Team name"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 182,
                                columnNumber: 16
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                "aria-label": `Imported team ${index + 1} name`,
                                value: team.name,
                                placeholder: "Team name",
                                onChange: (event)=>onChange({
                                        ...team,
                                        name: event.target.value
                                    })
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 182,
                                columnNumber: 38
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                        lineNumber: 182,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Manager"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 183,
                                columnNumber: 16
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                "aria-label": `${team.name} manager`,
                                value: team.manager ?? "",
                                placeholder: "Manager",
                                onChange: (event)=>onChange({
                                        ...team,
                                        manager: event.target.value
                                    })
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 183,
                                columnNumber: 36
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                        lineNumber: 183,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Division"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 184,
                                columnNumber: 16
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                "aria-label": `${team.name} division`,
                                value: division,
                                placeholder: "Division",
                                onChange: (event)=>onChange({
                                        ...team,
                                        division: cleanDivisionName(event.target.value)
                                    })
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 184,
                                columnNumber: 37
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                        lineNumber: 184,
                        columnNumber: 9
                    }, this),
                    showVenue && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Home venue"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 185,
                                columnNumber: 30
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                "aria-label": `${team.name} venue`,
                                value: team.stadium ?? "",
                                placeholder: "Home venue",
                                onChange: (event)=>onChange({
                                        ...team,
                                        stadium: event.target.value
                                    })
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 185,
                                columnNumber: 53
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                        lineNumber: 185,
                        columnNumber: 23
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "import-review-remove",
                        "aria-label": `Remove ${team.name || `team ${index + 1}`}`,
                        title: canRemove ? "Remove team" : "Keep at least 8 teams",
                        disabled: !canRemove,
                        onClick: onRemove,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {}, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                            lineNumber: 186,
                            columnNumber: 223
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                        lineNumber: 186,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                lineNumber: 179,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
        lineNumber: 172,
        columnNumber: 5
    }, this);
}
function ImportLeagueModal({ source, setup, onClose, onConfirm }) {
    const [identifier, setIdentifier] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [season, setSeason] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(String(setup.seasonYear));
    const syncMode = "manual";
    const [pasteValue, setPasteValue] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [preview, setPreview] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [expandedTeams, setExpandedTeams] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(new Set());
    const [espnHelpOpen, setEspnHelpOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [savedEspnImports, setSavedEspnImports] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [dragging, setDragging] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [reviewDirty, setReviewDirty] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [discardPrompt, setDiscardPrompt] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const reviewListRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const abortRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const manualIdCounter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(0);
    const meta = SOURCE_META[source];
    // Once someone is editing a parsed roster, an accidental backdrop click or Escape
    // shouldn't silently throw the work away — confirm first. A fresh (untouched)
    // preview or the input step still closes instantly, so we only nag when there's
    // real work to lose.
    const requestClose = ()=>{
        if (preview && reviewDirty) {
            setDiscardPrompt("close");
            return;
        }
        abortRef.current?.abort();
        onClose();
    };
    const backToInput = ()=>{
        if (reviewDirty) {
            setDiscardPrompt("back");
            return;
        }
        setPreview(null);
        setReviewDirty(false);
    };
    const confirmDiscard = ()=>{
        if (discardPrompt === "close") {
            abortRef.current?.abort();
            onClose();
        } else {
            setPreview(null);
            setReviewDirty(false);
        }
        setDiscardPrompt(null);
    };
    // Abort any in-flight import fetch if the modal unmounts mid-request. Focus,
    // scroll lock, and Escape are handled by <Modal>.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>()=>abortRef.current?.abort(), []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (source === "espn") setSavedEspnImports(loadSavedEspnImports());
    }, [
        source
    ]);
    const supported = preview ? preview.teams.length >= 8 && preview.teams.length <= 16 && preview.teams.length % 2 === 0 : false;
    const duplicatePreviewNames = preview ? preview.teams.map((team)=>team.name.trim().toLowerCase()).filter(Boolean).filter((name, index, names)=>names.indexOf(name) !== index) : [];
    const rosterMessage = preview && !supported ? `League Weaver needs an even roster of 8–16 teams. This preview has ${preview.teams.length}.` : null;
    const duplicateMessage = duplicatePreviewNames.length ? "Rename duplicate teams before importing. Duplicate names make score entry, standings, and exports confusing." : null;
    // The per-team blockers a commissioner can actually fix in review (unnamed or duplicate).
    // A wrong-count/odd roster isn't in here because jumping to a row wouldn't help with it.
    const problemTeamIndices = preview ? preview.teams.reduce((indices, team, index)=>{
        const isDuplicate = Boolean(team.name.trim()) && duplicatePreviewNames.includes(team.name.trim().toLowerCase());
        if (!team.name.trim() || isDuplicate) indices.push(index);
        return indices;
    }, []) : [];
    const jumpToProblems = ()=>{
        if (!problemTeamIndices.length) return;
        setExpandedTeams((current)=>{
            const next = new Set(current);
            problemTeamIndices.forEach((index)=>next.add(index));
            return next;
        });
        // Instant, not smooth: smooth scrollIntoView silently no-ops inside this nested
        // overflow:auto table (the animation gets cancelled by the expand re-render), so the
        // jump would appear to do nothing. An instant scroll reliably brings the row into view.
        requestAnimationFrame(()=>reviewListRef.current?.querySelector(".import-review-row.has-problem")?.scrollIntoView({
                block: "center"
            }));
    };
    const canStart = source === "csv" || source === "paste" ? pasteValue.trim().length > 0 : source === "screenshot" ? true : identifier.trim().length > 0;
    // ESPN league IDs are numeric (and its share URLs carry `leagueId=<number>`), so a value
    // with no digit at all is almost certainly a typo — flag it before we spend a round-trip.
    // Sleeper accepts a username, so we don't validate its shape.
    const espnIdentifierInvalid = source === "espn" && identifier.trim().length > 0 && !/\d/.test(identifier);
    const reviewColumns = preview?.provider === "espn" ? "78px 115px minmax(150px,1.2fr) minmax(120px,.9fr) minmax(110px,.8fr) 40px" : "78px 115px minmax(150px,1.2fr) minmax(120px,.9fr) minmax(110px,.8fr) minmax(140px,1fr) 40px";
    const createPreview = async ()=>{
        if (loading) return;
        setLoading(true);
        setError(null);
        const controller = new AbortController();
        abortRef.current = controller;
        try {
            if (source === "csv" || source === "paste") {
                const parsed = parsePastedRoster(pasteValue, source);
                if (!parsed.teams.length) {
                    setError("We couldn't find any teams in that text. Paste one team per line, or tap “Paste sample” to see the format.");
                    return;
                }
                openReview(parsed);
                return;
            }
            if (source === "screenshot") return;
            const response = await fetch(`/api/import/${source}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    identifier,
                    seasonYear: Number(season)
                }),
                signal: controller.signal
            });
            const result = await response.json().catch(()=>({}));
            if (!response.ok) throw new Error((0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$apiErrors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["apiErrorMessage"])(response.status, result.error, "The league could not be imported."));
            result.syncMode = syncMode;
            if (source === "espn") setSavedEspnImports(saveEspnImport(identifier.trim(), result));
            openReview(result);
        } catch (caught) {
            if (controller.signal.aborted) return;
            setError(caught instanceof Error ? caught.message : "The league could not be imported.");
        } finally{
            if (!controller.signal.aborted) setLoading(false);
        }
    };
    const handleScreenshot = async (file)=>{
        if (!file) return;
        if (loading) return;
        if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) {
            setError("Choose a PNG, JPG, or WebP image under 8 MB.");
            return;
        }
        setLoading(true);
        setError(null);
        const controller = new AbortController();
        abortRef.current = controller;
        try {
            const imageDataUrl = await readImage(file);
            const response = await fetch("/api/import/screenshot", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    imageDataUrl,
                    seasonYear: Number(season)
                }),
                signal: controller.signal
            });
            const result = await response.json().catch(()=>({}));
            if (!response.ok) throw new Error((0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$apiErrors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["apiErrorMessage"])(response.status, result.error, "The screenshot could not be read."));
            openReview(result);
        } catch (caught) {
            if (controller.signal.aborted) return;
            setError(caught instanceof Error ? caught.message : "The screenshot could not be read.");
        } finally{
            if (!controller.signal.aborted) setLoading(false);
        }
    };
    const updateTeam = (index, next)=>{
        setReviewDirty(true);
        setPreview((current)=>current ? {
                ...current,
                teams: current.teams.map((team, teamIndex)=>teamIndex === index ? next : team)
            } : current);
    };
    const removeTeam = (index)=>{
        setReviewDirty(true);
        setPreview((current)=>current ? {
                ...current,
                teams: current.teams.filter((_, teamIndex)=>teamIndex !== index)
            } : current);
    };
    const addTeam = ()=>{
        setReviewDirty(true);
        setPreview((current)=>{
            if (!current || current.teams.length >= MAX_IMPORT_TEAMS) return current;
            const position = current.teams.length;
            const blank = {
                providerId: `manual-${manualIdCounter.current++}`,
                city: "",
                name: "",
                manager: "",
                division: "",
                rank: position + 1,
                stadium: "",
                color: TEAM_COLORS[position % TEAM_COLORS.length]
            };
            return {
                ...current,
                teams: [
                    ...current.teams,
                    blank
                ]
            };
        });
    };
    const customYearOptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const years = [];
        for(let year = setup.seasonYear + 1; year >= setup.seasonYear - 9; year -= 1)years.push(year);
        return years.map((year)=>({
                value: String(year),
                label: `${year} season`
            }));
    }, [
        setup.seasonYear
    ]);
    const csvShape = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>detectRosterShape(pasteValue), [
        pasteValue
    ]);
    const openReview = (result)=>{
        const incomplete = new Set();
        result.teams.forEach((team, index)=>{
            if (!team.name.trim()) incomplete.add(index);
        });
        setExpandedTeams(incomplete);
        setPreview(result);
        setReviewDirty(false);
    };
    const toggleTeam = (index)=>setExpandedTeams((current)=>{
            const next = new Set(current);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    const handleCsvFile = (file)=>{
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            setError("Choose a CSV or text file under 2 MB.");
            return;
        }
        const reader = new FileReader();
        reader.onload = ()=>{
            setError(null);
            setPasteValue(String(reader.result || "").slice(0, MAX_PASTE_IMPORT_CHARS));
        };
        reader.onerror = ()=>setError("We couldn't read that file.");
        reader.readAsText(file);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$Modal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Modal"], {
        onClose: requestClose,
        className: "import-modal",
        labelledBy: "import-modal-title",
        busy: loading,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "import-modal-head",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: `import-provider-mark ${source}`,
                        children: meta.icon
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                        lineNumber: 378,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "step-kicker",
                                children: "League import"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 379,
                                columnNumber: 16
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                id: "import-modal-title",
                                children: meta.title
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 379,
                                columnNumber: 66
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: meta.description
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 379,
                                columnNumber: 111
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                        lineNumber: 379,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "icon-button",
                        "aria-label": "Close import",
                        onClick: requestClose,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {}, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                            lineNumber: 380,
                            columnNumber: 106
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                        lineNumber: 380,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                lineNumber: 377,
                columnNumber: 9
            }, this),
            !preview ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "import-modal-body",
                children: [
                    (source === "sleeper" || source === "espn") && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "import-form-grid",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: source === "sleeper" ? "League ID or username" : "Public ESPN league URL or ID"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                lineNumber: 387,
                                                columnNumber: 24
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                autoFocus: true,
                                                value: identifier,
                                                onChange: (event)=>setIdentifier(event.target.value),
                                                placeholder: source === "sleeper" ? "Example: 123456789 or username" : "https://fantasy.espn.com/football/league?leagueId=11593953"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                lineNumber: 387,
                                                columnNumber: 118
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 387,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "Season"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                lineNumber: 388,
                                                columnNumber: 24
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$CustomSelect$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CustomSelect"], {
                                                label: "Import season",
                                                value: season,
                                                onChange: setSeason,
                                                options: customYearOptions
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                lineNumber: 388,
                                                columnNumber: 43
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 388,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 386,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "import-hint",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"], {}, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 390,
                                        columnNumber: 42
                                    }, this),
                                    source === "sleeper" ? "Read-only. Works with your league ID or Sleeper username — refresh teams and scores anytime, no password." : "Read-only. Refresh teams and scores whenever you click — no password, ever."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 390,
                                columnNumber: 15
                            }, this),
                            espnIdentifierInvalid && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "import-inline-hint",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {}, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 391,
                                        columnNumber: 75
                                    }, this),
                                    "Add your league URL or the numeric League ID — usually the number right after “leagueId=”."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 391,
                                columnNumber: 41
                            }, this),
                            source === "espn" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "import-public-note",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldCheck$3e$__["ShieldCheck"], {}, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                lineNumber: 393,
                                                columnNumber: 53
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        children: "Your ESPN league must be public to import."
                                                    }, void 0, false, {
                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                        lineNumber: 393,
                                                        columnNumber: 73
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "League Weaver reads public league data only — it never needs your ESPN password."
                                                    }, void 0, false, {
                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                        lineNumber: 393,
                                                        columnNumber: 132
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                lineNumber: 393,
                                                columnNumber: 68
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 393,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "import-help",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                className: "import-help-toggle",
                                                "aria-expanded": espnHelpOpen,
                                                onClick: ()=>setEspnHelpOpen((current)=>!current),
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$question$2d$mark$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__HelpCircle$3e$__["HelpCircle"], {}, void 0, false, {
                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                        lineNumber: 395,
                                                        columnNumber: 156
                                                    }, this),
                                                    "Find your League ID & make your league public",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                                                        className: espnHelpOpen ? "open" : ""
                                                    }, void 0, false, {
                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                        lineNumber: 395,
                                                        columnNumber: 219
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                lineNumber: 395,
                                                columnNumber: 19
                                            }, this),
                                            espnHelpOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "import-help-steps",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                                children: "On desktop"
                                                            }, void 0, false, {
                                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                                lineNumber: 398,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                        children: [
                                                                            "Open your league at fantasy.espn.com — your League ID is the number after ",
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                                                                children: "leagueId="
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                                                lineNumber: 400,
                                                                                columnNumber: 103
                                                                            }, this),
                                                                            " in the address bar. Paste the whole URL or just that number above."
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                                        lineNumber: 400,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                        children: "From League Home, go to League → Settings."
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                                        lineNumber: 401,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                        children: "On the Basic Settings card, set “Make League Viewable to Public” to Yes (click Edit first if it’s set to No)."
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                                        lineNumber: 402,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                                lineNumber: 399,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                        lineNumber: 397,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                                children: "In the ESPN app"
                                                            }, void 0, false, {
                                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                                lineNumber: 406,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                        children: "Tap the League tab, then League Info."
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                                        lineNumber: 408,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                        children: "Find your League ID on the Basic Settings card."
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                                        lineNumber: 409,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                        children: "On that same card, confirm “Make League Viewable to Public” is Yes."
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                                        lineNumber: 410,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                                lineNumber: 407,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                        lineNumber: 405,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                lineNumber: 396,
                                                columnNumber: 36
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 394,
                                        columnNumber: 17
                                    }, this),
                                    savedEspnImports.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "saved-imports",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        children: "Recent ESPN imports"
                                                    }, void 0, false, {
                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                        lineNumber: 415,
                                                        columnNumber: 86
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                        children: "Pick a saved public league URL."
                                                    }, void 0, false, {
                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                        lineNumber: 415,
                                                        columnNumber: 122
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                lineNumber: 415,
                                                columnNumber: 80
                                            }, this),
                                            savedEspnImports.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    onClick: ()=>{
                                                        setIdentifier(item.identifier);
                                                        setSeason(String(item.seasonYear));
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "saved-import-info",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                                    children: item.leagueName
                                                                }, void 0, false, {
                                                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                                    lineNumber: 416,
                                                                    columnNumber: 55
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                                    children: [
                                                                        item.teamCount,
                                                                        " teams · ",
                                                                        item.divisions.length ? item.divisions.join(" / ") : "No divisions",
                                                                        " · ",
                                                                        item.seasonYear
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                                    lineNumber: 416,
                                                                    columnNumber: 89
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                            lineNumber: 416,
                                                            columnNumber: 19
                                                        }, this),
                                                        item.teamMarks && item.teamMarks.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "saved-import-logos",
                                                            children: item.teamMarks.map((mark, markIndex)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "saved-import-mark",
                                                                    style: {
                                                                        background: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$colorContrast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tintColor"])(mark.color)
                                                                    },
                                                                    children: mark.url && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                                        src: mark.url,
                                                                        alt: "",
                                                                        loading: "lazy"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                                        lineNumber: 417,
                                                                        columnNumber: 256
                                                                    }, this)
                                                                }, markIndex, false, {
                                                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                                    lineNumber: 417,
                                                                    columnNumber: 145
                                                                }, this))
                                                        }, void 0, false, {
                                                            fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                            lineNumber: 417,
                                                            columnNumber: 67
                                                        }, this)
                                                    ]
                                                }, `${item.id}-${item.seasonYear}`, true, {
                                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                    lineNumber: 415,
                                                    columnNumber: 207
                                                }, this))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 415,
                                        columnNumber: 49
                                    }, this)
                                ]
                            }, void 0, true)
                        ]
                    }, void 0, true),
                    (source === "csv" || source === "paste") && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "paste-import",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "paste-toolbar",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: "paste-chip",
                                        onClick: ()=>setPasteValue(SAMPLE_ROSTER),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__["Sparkles"], {}, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                lineNumber: 424,
                                                columnNumber: 107
                                            }, this),
                                            "Paste sample"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 424,
                                        columnNumber: 17
                                    }, this),
                                    source === "csv" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: "paste-chip",
                                        onClick: downloadCsvTemplate,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$down$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileDown$3e$__["FileDown"], {}, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                lineNumber: 425,
                                                columnNumber: 113
                                            }, this),
                                            "Template"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 425,
                                        columnNumber: 38
                                    }, this),
                                    source === "csv" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "paste-chip",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__["Upload"], {}, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                lineNumber: 426,
                                                columnNumber: 68
                                            }, this),
                                            "Upload file",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "file",
                                                accept: ".csv,.tsv,.txt,text/csv,text/plain",
                                                onChange: (event)=>{
                                                    handleCsvFile(event.target.files?.[0]);
                                                    event.target.value = "";
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                lineNumber: 426,
                                                columnNumber: 89
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 426,
                                        columnNumber: 38
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 423,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: `paste-field${dragging ? " is-dragging" : ""}`,
                                onDragOver: source === "csv" ? (event)=>{
                                    event.preventDefault();
                                    setDragging(true);
                                } : undefined,
                                onDragLeave: source === "csv" ? (event)=>{
                                    if (event.currentTarget === event.target) setDragging(false);
                                } : undefined,
                                onDrop: source === "csv" ? (event)=>{
                                    event.preventDefault();
                                    setDragging(false);
                                    handleCsvFile(event.dataTransfer.files?.[0]);
                                } : undefined,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Roster rows"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 434,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                        autoFocus: true,
                                        value: pasteValue,
                                        onChange: (event)=>setPasteValue(event.target.value),
                                        placeholder: "City, Team, Manager, Division, Rank, Venue\nBrooklyn, Sunday Architects, Anthony, North, 1, Foundry Field"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 435,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                        children: source === "csv" ? "Paste from Google Sheets or Excel, drop a .csv here, or upload a file. Tabs and commas both work." : "One team per line, or comma-separated rows."
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 436,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 428,
                                columnNumber: 15
                            }, this),
                            pasteValue.trim().length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `paste-detected${csvShape.count >= 8 && csvShape.count <= 16 && csvShape.count % 2 === 0 ? " ok" : ""}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {}, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 439,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: [
                                                    csvShape.count,
                                                    " ",
                                                    csvShape.count === 1 ? "team" : "teams",
                                                    " detected"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                lineNumber: 440,
                                                columnNumber: 23
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                children: csvShape.hasHeader ? "Headers found — mapping City · Team · Manager · Division · Rank · Venue · Color." : "No headers — reading columns as Team · Manager · Division · Rank · Venue."
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                                lineNumber: 440,
                                                columnNumber: 107
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 440,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 438,
                                columnNumber: 48
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                        lineNumber: 422,
                        columnNumber: 58
                    }, this),
                    source === "screenshot" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `screenshot-drop${dragging ? " is-dragging" : ""}`,
                        onDragOver: (event)=>{
                            event.preventDefault();
                            if (!loading) setDragging(true);
                        },
                        onDragLeave: (event)=>{
                            if (event.currentTarget === event.target) setDragging(false);
                        },
                        onDrop: (event)=>{
                            event.preventDefault();
                            setDragging(false);
                            if (!loading) handleScreenshot(event.dataTransfer.files?.[0]);
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                id: "screenshot-file",
                                type: "file",
                                accept: "image/png,image/jpeg,image/webp",
                                onChange: (event)=>handleScreenshot(event.target.files?.[0])
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 450,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                htmlFor: "screenshot-file",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__["Upload"], {}, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 451,
                                        columnNumber: 48
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Choose a league screenshot"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 451,
                                        columnNumber: 58
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "PNG, JPG, or WebP up to 8 MB"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 451,
                                        columnNumber: 101
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 451,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "screenshot-safety",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldCheck$3e$__["ShieldCheck"], {}, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 452,
                                        columnNumber: 50
                                    }, this),
                                    "Nothing is saved until you review and confirm."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 452,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                        lineNumber: 444,
                        columnNumber: 41
                    }, this),
                    loading && (source === "espn" || source === "sleeper") && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "import-inline-hint import-inline-hint-wait",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LoaderCircle$3e$__["LoaderCircle"], {
                                className: "spin"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 455,
                                columnNumber: 130
                            }, this),
                            "Fetching your league — public ESPN and Sleeper leagues usually take just a few seconds."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                        lineNumber: 455,
                        columnNumber: 72
                    }, this),
                    error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "import-error",
                        role: "alert",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {}, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 456,
                                columnNumber: 66
                            }, this),
                            error
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                        lineNumber: 456,
                        columnNumber: 23
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                lineNumber: 384,
                columnNumber: 11
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "import-modal-body import-review",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "import-review-summary",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "import-review-summary-lead",
                                children: [
                                    preview.leagueName && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "import-review-league",
                                        children: preview.leagueName
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 462,
                                        columnNumber: 40
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "import-review-count",
                                        children: [
                                            preview.teams.length,
                                            " ",
                                            preview.teams.length === 1 ? "team" : "teams",
                                            " found"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 463,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: "Review team names, logos, team colors, managers, and divisions."
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 464,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 461,
                                columnNumber: 15
                            }, this),
                            supported && problemTeamIndices.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "import-status ready",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {}, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 467,
                                        columnNumber: 57
                                    }, this),
                                    "Ready"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 467,
                                columnNumber: 19
                            }, this) : problemTeamIndices.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "import-status blocked import-status-button",
                                onClick: jumpToProblems,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {}, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 469,
                                        columnNumber: 123
                                    }, this),
                                    problemTeamIndices.length,
                                    " to fix"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 469,
                                columnNumber: 21
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "import-status blocked",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {}, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 470,
                                        columnNumber: 61
                                    }, this),
                                    "Needs edits"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 470,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                        lineNumber: 460,
                        columnNumber: 13
                    }, this),
                    preview.dataFound && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "import-data-found",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: [
                                            preview.dataFound.availableHistoryYears.length || "No",
                                            " history years"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 473,
                                        columnNumber: 21
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                        children: preview.dataFound.availableHistoryYears.join(", ") || "None found yet"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 473,
                                        columnNumber: 108
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 473,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: preview.dataFound.hasDraftData ? "Draft found" : "No draft yet"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 474,
                                        columnNumber: 21
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                        children: "Team setup stays active."
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 474,
                                        columnNumber: 103
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 474,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Player data paused"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 475,
                                        columnNumber: 21
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                        children: "Team setup and score refresh stay active."
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 475,
                                        columnNumber: 56
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 475,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: preview.dataFound.hasScoreSync ? "Score refresh ready" : "Scores unavailable"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 476,
                                        columnNumber: 21
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                        children: "Manual score refresh stays free."
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 476,
                                        columnNumber: 117
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 476,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                        lineNumber: 472,
                        columnNumber: 35
                    }, this),
                    (rosterMessage || duplicateMessage || preview.warnings.length > 0 || preview.provider === "espn") && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "import-warning",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {}, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 478,
                                columnNumber: 147
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    rosterMessage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: rosterMessage
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 478,
                                        columnNumber: 185
                                    }, this),
                                    duplicateMessage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: duplicateMessage
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 478,
                                        columnNumber: 239
                                    }, this),
                                    preview.provider === "espn" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Home venues are added after import on the Teams step."
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 478,
                                        columnNumber: 307
                                    }, this),
                                    preview.warnings.map((warning)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: warning
                                        }, warning, false, {
                                            fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                            lineNumber: 478,
                                            columnNumber: 413
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 478,
                                columnNumber: 162
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                        lineNumber: 478,
                        columnNumber: 115
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "import-review-controls",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Tap a team to edit its details"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 480,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: ()=>setExpandedTeams(expandedTeams.size === preview.teams.length ? new Set() : new Set(preview.teams.map((_, index)=>index))),
                                children: expandedTeams.size === preview.teams.length ? "Collapse all" : "Expand all"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 481,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                        lineNumber: 479,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "import-review-table",
                        style: {
                            "--import-review-columns": reviewColumns
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "import-review-head",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Logo/color"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 484,
                                        columnNumber: 51
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "City"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 484,
                                        columnNumber: 74
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Team name"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 484,
                                        columnNumber: 91
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Manager"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 484,
                                        columnNumber: 113
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Division"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 484,
                                        columnNumber: 133
                                    }, this),
                                    preview.provider !== "espn" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Venue"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 484,
                                        columnNumber: 186
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        "aria-hidden": "true"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 484,
                                        columnNumber: 205
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 484,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "import-review-list",
                                ref: reviewListRef,
                                children: preview.teams.map((team, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(TeamPreviewRow, {
                                        team: team,
                                        index: index,
                                        source: preview.provider,
                                        expanded: expandedTeams.has(index),
                                        duplicate: Boolean(team.name.trim()) && duplicatePreviewNames.includes(team.name.trim().toLowerCase()),
                                        onToggle: ()=>toggleTeam(index),
                                        onChange: (next)=>updateTeam(index, next),
                                        onRemove: ()=>removeTeam(index),
                                        canRemove: preview.teams.length > 8
                                    }, team.providerId ?? index, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 485,
                                        columnNumber: 107
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 485,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                        lineNumber: 483,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "import-review-foot",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "import-review-add",
                                disabled: preview.teams.length >= MAX_IMPORT_TEAMS,
                                onClick: addTeam,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {}, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                        lineNumber: 488,
                                        columnNumber: 137
                                    }, this),
                                    "Add a team"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 488,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                children: [
                                    preview.teams.length,
                                    " of 8–16 teams · League Weaver needs an even roster."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 489,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                        lineNumber: 487,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                lineNumber: 459,
                columnNumber: 11
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                className: "import-modal-actions",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "button-secondary visible",
                        disabled: loading,
                        onClick: preview ? backToInput : requestClose,
                        children: preview ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__["ArrowLeft"], {}, void 0, false, {
                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                    lineNumber: 495,
                                    columnNumber: 149
                                }, this),
                                "Back"
                            ]
                        }, void 0, true) : "Cancel"
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                        lineNumber: 495,
                        columnNumber: 11
                    }, this),
                    !preview && source !== "screenshot" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "button-primary",
                        disabled: !canStart || loading,
                        onClick: createPreview,
                        children: loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LoaderCircle$3e$__["LoaderCircle"], {
                                    className: "spin"
                                }, void 0, false, {
                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                    lineNumber: 496,
                                    columnNumber: 169
                                }, this),
                                "Importing…"
                            ]
                        }, void 0, true) : "Review import"
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                        lineNumber: 496,
                        columnNumber: 51
                    }, this),
                    preview && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "button-primary",
                        disabled: !supported || Boolean(duplicateMessage) || preview.teams.some((team)=>!team.name.trim()),
                        onClick: ()=>onConfirm(preview),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {}, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                                lineNumber: 497,
                                columnNumber: 209
                            }, this),
                            "Use this roster"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                        lineNumber: 497,
                        columnNumber: 23
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                lineNumber: 494,
                columnNumber: 9
            }, this),
            discardPrompt && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$Modal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ConfirmDialog"], {
                role: "alertdialog",
                tone: "danger",
                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash$3e$__["Trash"], {}, void 0, false, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                    lineNumber: 502,
                    columnNumber: 15
                }, void 0),
                kicker: "UNSAVED EDITS",
                title: discardPrompt === "close" ? "Discard this imported roster?" : "Discard your edits?",
                closeLabel: "Keep editing",
                onClose: ()=>setDiscardPrompt(null),
                actions: [
                    {
                        label: "Keep editing",
                        onClick: ()=>setDiscardPrompt(null),
                        variant: "secondary",
                        autoFocus: true
                    },
                    {
                        label: discardPrompt === "close" ? "Discard roster" : "Discard and go back",
                        onClick: confirmDiscard,
                        variant: "danger",
                        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash$3e$__["Trash"], {}, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                            lineNumber: 509,
                            columnNumber: 140
                        }, void 0)
                    }
                ],
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    children: discardPrompt === "close" ? "Your team edits won’t be saved." : "Your team edits will be lost, and you’ll choose a different import."
                }, void 0, false, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                    lineNumber: 512,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
                lineNumber: 499,
                columnNumber: 25
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx",
        lineNumber: 376,
        columnNumber: 5
    }, this);
}
}),
"[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GenerationReveal",
    ()=>GenerationReveal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$dom$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-dom.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-left.mjs [app-ssr] (ecmascript) <export default as ArrowLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeftRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-left-right.mjs [app-ssr] (ecmascript) <export default as ArrowLeftRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-right.mjs [app-ssr] (ecmascript) <export default as ArrowRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2d$days$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CalendarDays$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/calendar-days.mjs [app-ssr] (ecmascript) <export default as CalendarDays>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-left.mjs [app-ssr] (ecmascript) <export default as ChevronLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-right.mjs [app-ssr] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$flag$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Flag$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/flag.mjs [app-ssr] (ecmascript) <export default as Flag>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$flame$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Flame$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/flame.mjs [app-ssr] (ecmascript) <export default as Flame>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gauge$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Gauge$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/gauge.mjs [app-ssr] (ecmascript) <export default as Gauge>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/rotate-ccw.mjs [app-ssr] (ecmascript) <export default as RotateCcw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$route$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Route$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/route.mjs [app-ssr] (ecmascript) <export default as Route>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/sparkles.mjs [app-ssr] (ecmascript) <export default as Sparkles>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/star.mjs [app-ssr] (ecmascript) <export default as Star>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$swords$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Swords$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/swords.mjs [app-ssr] (ecmascript) <export default as Swords>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trophy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trophy$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trophy.mjs [app-ssr] (ecmascript) <export default as Trophy>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/users.mjs [app-ssr] (ecmascript) <export default as Users>");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$schedule$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/schedule.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$revealStats$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/revealStats.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$colorContrast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/colorContrast.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$EntityLogo$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/components/ui/EntityLogo.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$teamIdentity$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/teamIdentity.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
;
;
const monthDay = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC"
});
function GenerationReveal({ schedule, onComplete, mode = "generate" }) {
    const scenes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>buildScenes(schedule, mode), [
        schedule,
        mode
    ]);
    const [index, setIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const [paused, setPaused] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [reduced, setReduced] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const stageRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const last = scenes.length - 1;
    const scene = scenes[Math.min(index, last)] ?? scenes[0];
    const finished = index >= last;
    const next = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>setIndex((current)=>Math.min(last, current + 1)), [
        last
    ]);
    const prev = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>setIndex((current)=>Math.max(0, current - 1)), []);
    const replay = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        setIndex(0);
        setPaused(false);
    }, []);
    // Honor reduced-motion: no auto-advance and no fill animation; the story is
    // driven entirely by the explicit Prev/Next controls and the keyboard instead.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const query = window.matchMedia("(prefers-reduced-motion: reduce)");
        const update = ()=>setReduced(query.matches);
        update();
        query.addEventListener("change", update);
        return ()=>query.removeEventListener("change", update);
    }, []);
    // Move focus into the story so arrow keys work without a click first.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        stageRef.current?.focus({
            preventScroll: true
        });
    }, []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const onKey = (event)=>{
            if (event.key === "Escape") {
                onComplete();
                return;
            }
            if (event.key === "ArrowRight") {
                event.preventDefault();
                next();
            } else if (event.key === "ArrowLeft") {
                event.preventDefault();
                prev();
            } else if (event.key === "Enter") {
                event.preventDefault();
                if (finished) onComplete();
                else next();
            } else if (event.key === " " || event.key === "Spacebar") {
                event.preventDefault();
                if (!finished && !reduced) setPaused((current)=>!current);
            }
        };
        window.addEventListener("keydown", onKey);
        return ()=>window.removeEventListener("keydown", onKey);
    }, [
        onComplete,
        next,
        prev,
        finished,
        reduced
    ]);
    // Press-and-hold anywhere pauses the story (Instagram/Wrapped gesture); a quick
    // tap navigates — left third goes back, the rest goes forward.
    const holdTimer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(undefined);
    const didHold = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    const clearHold = ()=>{
        if (holdTimer.current) window.clearTimeout(holdTimer.current);
        holdTimer.current = undefined;
    };
    const onPointerDown = ()=>{
        didHold.current = false;
        clearHold();
        holdTimer.current = window.setTimeout(()=>{
            didHold.current = true;
            setPaused(true);
        }, 220);
    };
    const onPointerUp = (event)=>{
        clearHold();
        if (didHold.current) {
            didHold.current = false;
            setPaused(false);
            return;
        }
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX - rect.left < rect.width * 0.33) prev();
        else next();
    };
    const onPointerCancel = ()=>{
        clearHold();
        if (didHold.current) {
            didHold.current = false;
            setPaused(false);
        }
    };
    // Render past any transformed ancestor so the fixed overlay always fills the
    // viewport. GenerationReveal only mounts after a client-side click, so this
    // never runs during SSR, but guard document defensively all the same.
    if (typeof document === "undefined") return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$dom$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createPortal"])(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "reveal-overlay",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "Your season, unveiled",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "reveal-stage",
                ref: stageRef,
                tabIndex: -1,
                style: scene.wash ? {
                    "--wash-a": scene.wash[0],
                    "--wash-b": scene.wash[1]
                } : undefined,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "reveal-segments",
                        "aria-hidden": "true",
                        children: scenes.map((item, itemIndex)=>{
                            const done = itemIndex < index || itemIndex === index && finished;
                            const active = itemIndex === index && !finished && !reduced;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: `reveal-seg${done ? " done" : ""}${itemIndex === index ? " current" : ""}`,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {
                                    style: active ? {
                                        animationDuration: `${item.holdMs}ms`,
                                        animationPlayState: paused ? "paused" : "running"
                                    } : undefined,
                                    onAnimationEnd: active ? next : undefined
                                }, void 0, false, {
                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                    lineNumber: 144,
                                    columnNumber: 17
                                }, this)
                            }, item.key, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                lineNumber: 143,
                                columnNumber: 15
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                        lineNumber: 138,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "reveal-brandline",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__["Sparkles"], {
                                "aria-hidden": "true"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                lineNumber: 154,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: finished ? "Season woven" : "Weaving your season"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                lineNumber: 155,
                                columnNumber: 11
                            }, this),
                            paused && !finished && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("em", {
                                className: "reveal-paused",
                                children: "Paused"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                lineNumber: 156,
                                columnNumber: 35
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                        lineNumber: 153,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "reveal-scene",
                        children: [
                            scene.art ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                className: "reveal-art",
                                src: scene.art,
                                alt: "",
                                "aria-hidden": "true",
                                draggable: false
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                lineNumber: 161,
                                columnNumber: 15
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "reveal-icon",
                                "aria-hidden": "true",
                                children: scene.icon
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                lineNumber: 162,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "reveal-kicker",
                                children: scene.kicker
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                lineNumber: 163,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "reveal-value",
                                role: "status",
                                "aria-live": "polite",
                                children: scene.value
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                lineNumber: 164,
                                columnNumber: 11
                            }, this),
                            scene.caption && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "reveal-caption",
                                children: scene.caption
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                lineNumber: 165,
                                columnNumber: 29
                            }, this),
                            index === 0 && !reduced && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "reveal-hint",
                                "aria-hidden": "true",
                                children: "Tap to move · hold to pause"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                lineNumber: 166,
                                columnNumber: 39
                            }, this)
                        ]
                    }, scene.key, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                        lineNumber: 159,
                        columnNumber: 9
                    }, this),
                    finished && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "reveal-actions",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "reveal-cta",
                                onClick: onComplete,
                                children: mode === "replay" ? "Back to schedule →" : "See my schedule →"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                lineNumber: 171,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "reveal-actions-secondary",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: prev,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__["ArrowLeft"], {
                                                "aria-hidden": "true"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                                lineNumber: 173,
                                                columnNumber: 52
                                            }, this),
                                            "Back"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                        lineNumber: 173,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: replay,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__["RotateCcw"], {
                                                "aria-hidden": "true"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                                lineNumber: 174,
                                                columnNumber: 54
                                            }, this),
                                            "Replay"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                        lineNumber: 174,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                lineNumber: 172,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                        lineNumber: 170,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                lineNumber: 132,
                columnNumber: 7
            }, this),
            !finished && !reduced && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "reveal-tapzone",
                "aria-hidden": "true",
                onPointerDown: onPointerDown,
                onPointerUp: onPointerUp,
                onPointerCancel: onPointerCancel,
                onPointerLeave: onPointerCancel
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                lineNumber: 182,
                columnNumber: 9
            }, this),
            !finished && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "reveal-arrow reveal-arrow-left",
                        onClick: prev,
                        disabled: index === 0,
                        "aria-label": "Previous",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__["ChevronLeft"], {
                            "aria-hidden": "true"
                        }, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                            lineNumber: 195,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                        lineNumber: 194,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "reveal-arrow reveal-arrow-right",
                        onClick: next,
                        "aria-label": "Next",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                            "aria-hidden": "true"
                        }, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                            lineNumber: 198,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                        lineNumber: 197,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true),
            !finished && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                className: "reveal-skip",
                onClick: onComplete,
                children: mode === "replay" ? "Close" : "Skip to my schedule →"
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                lineNumber: 204,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
        lineNumber: 131,
        columnNumber: 5
    }, this), document.body);
}
/** Order-independent key for a matchup, so a pair reads the same home or away. */ function pairKey(game) {
    return [
        game.homeTeamId,
        game.awayTeamId
    ].sort((left, right)=>left.localeCompare(right)).join("~");
}
function buildScenes(schedule, mode) {
    const { setup } = schedule;
    const teamById = (id)=>setup.teams.find((team)=>team.id === id);
    const teamLabel = (id)=>{
        const team = teamById(id);
        if (!team) return "TBD";
        return setup.display.cityNames && team.city ? `${team.city} ${team.name}` : team.name;
    };
    // Prefer the team's own image (no colour-tinted backing) and fall back to a
    // colour + monogram chip only when a team has no logo.
    const crest = (team, size)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$EntityLogo$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EntityLogo"], {
            className: "reveal-crest",
            size: size,
            color: team.color,
            logoUrl: team.logoUrl,
            monogram: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$teamIdentity$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["teamInitials"])(team),
            imagePresentation: "bare"
        }, void 0, false, {
            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
            lineNumber: 227,
            columnNumber: 5
        }, this);
    // Size-flexible team mark: the raw logo image when a team has one (no colour
    // backing), or a small colour + initials chip otherwise. Lets tiny inline spots
    // (list rows, venue) show a real logo below EntityLogo's 32px floor.
    const teamMark = (team, size)=>team.logoUrl ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
            className: "reveal-mark",
            src: team.logoUrl,
            alt: "",
            width: size,
            height: size,
            style: {
                width: size,
                height: size
            },
            draggable: false
        }, void 0, false, {
            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
            lineNumber: 234,
            columnNumber: 9
        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "reveal-mark reveal-mark-mono",
            style: {
                width: size,
                height: size,
                background: team.color,
                color: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$colorContrast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["readableTextColor"])(team.color),
                fontSize: Math.round(size * 0.42)
            },
            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$teamIdentity$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["teamInitials"])(team)
        }, void 0, false, {
            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
            lineNumber: 235,
            columnNumber: 9
        }, this);
    const seed = (team)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "reveal-seed",
            children: [
                "#",
                team.overallRank
            ]
        }, void 0, true, {
            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
            lineNumber: 236,
            columnNumber: 32
        }, this);
    // Matchups read "away @ home" (the home team hosts), every team carries its
    // overall rank, and the strongest game of a slate is flagged Game of the Week
    // with the host's venue below it.
    const matchup = (game, { size = 112, gotw = false, venue = false } = {})=>{
        const home = teamById(game.homeTeamId);
        const away = teamById(game.awayTeamId);
        if (!home || !away) return null;
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "reveal-matchup-wrap",
            children: [
                gotw && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "reveal-gotw",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__["Star"], {
                            "aria-hidden": "true"
                        }, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                            lineNumber: 246,
                            columnNumber: 48
                        }, this),
                        "Game of the Week"
                    ]
                }, void 0, true, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                    lineNumber: 246,
                    columnNumber: 18
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: `reveal-matchup${size <= 76 ? " reveal-matchup-sm" : ""}`,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "reveal-team",
                            children: [
                                crest(away, size),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                    style: {
                                        color: away.color
                                    },
                                    children: teamLabel(away.id)
                                }, void 0, false, {
                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                    lineNumber: 248,
                                    columnNumber: 60
                                }, this),
                                seed(away)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                            lineNumber: 248,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("em", {
                            children: "@"
                        }, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                            lineNumber: 249,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "reveal-team",
                            children: [
                                crest(home, size),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                    style: {
                                        color: home.color
                                    },
                                    children: teamLabel(home.id)
                                }, void 0, false, {
                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                    lineNumber: 250,
                                    columnNumber: 60
                                }, this),
                                seed(home)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                            lineNumber: 250,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                    lineNumber: 247,
                    columnNumber: 9
                }, this),
                (venue && home.stadium || game.seriesLength > 1) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "reveal-meta",
                    children: [
                        venue && home.stadium && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "reveal-venue",
                            children: [
                                teamMark(home, 18),
                                home.stadium
                            ]
                        }, void 0, true, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                            lineNumber: 254,
                            columnNumber: 39
                        }, this),
                        game.seriesLength > 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "reveal-series",
                            children: [
                                "Game ",
                                game.seriesGame,
                                " of ",
                                game.seriesLength
                            ]
                        }, void 0, true, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                            lineNumber: 255,
                            columnNumber: 39
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                    lineNumber: 253,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
            lineNumber: 245,
            columnNumber: 7
        }, this);
    };
    // A compact "away @ home" row (with logos + ranks) for the truncated lineups.
    const gameRow = (game)=>{
        const home = teamById(game.homeTeamId);
        const away = teamById(game.awayTeamId);
        if (!home || !away) return null;
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "reveal-slate-game",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "reveal-slate-team",
                    children: [
                        teamMark(away, 24),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {
                            className: "reveal-seed-sm",
                            children: [
                                "#",
                                away.overallRank
                            ]
                        }, void 0, true, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                            lineNumber: 268,
                            columnNumber: 65
                        }, this),
                        away.name
                    ]
                }, void 0, true, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                    lineNumber: 268,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("em", {
                    children: "@"
                }, void 0, false, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                    lineNumber: 269,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "reveal-slate-team",
                    children: [
                        teamMark(home, 24),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {
                            className: "reveal-seed-sm",
                            children: [
                                "#",
                                home.overallRank
                            ]
                        }, void 0, true, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                            lineNumber: 270,
                            columnNumber: 65
                        }, this),
                        home.name
                    ]
                }, void 0, true, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                    lineNumber: 270,
                    columnNumber: 9
                }, this)
            ]
        }, game.id, true, {
            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
            lineNumber: 267,
            columnNumber: 7
        }, this);
    };
    // Headliner matchup + a truncated view of the rest of that week's slate.
    const slateValue = (headliner, rest, restLimit)=>{
        const value = matchup(headliner, {
            size: 64,
            gotw: true,
            venue: true
        });
        if (!value) return null;
        const shown = rest.slice(0, restLimit);
        const more = rest.length - shown.length;
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "reveal-slate",
            children: [
                value,
                shown.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "reveal-slate-rest",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "reveal-slate-label",
                            children: "Also that week"
                        }, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                            lineNumber: 285,
                            columnNumber: 13
                        }, this),
                        shown.map(gameRow),
                        more > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "reveal-slate-more",
                            children: [
                                "+",
                                more,
                                " more"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                            lineNumber: 287,
                            columnNumber: 26
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                    lineNumber: 284,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
            lineNumber: 281,
            columnNumber: 7
        }, this);
    };
    // A labelled stat line: tag · crest(s) · team(s) · metric.
    const statLine = (tag, teams, name, metric, key)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "reveal-statline",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "reveal-tag",
                    children: tag
                }, void 0, false, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                    lineNumber: 296,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "reveal-statline-teams",
                    children: teams.map((team)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: crest(team, 30)
                        }, team.id, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                            lineNumber: 297,
                            columnNumber: 68
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                    lineNumber: 297,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                    children: name
                }, void 0, false, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                    lineNumber: 298,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "reveal-metric",
                    children: metric
                }, void 0, false, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                    lineNumber: 299,
                    columnNumber: 7
                }, this)
            ]
        }, key, true, {
            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
            lineNumber: 295,
            columnNumber: 5
        }, this);
    const totalGames = schedule.weeks.reduce((count, week)=>count + week.games.length, 0);
    const milestones = seasonMilestones(setup.seasonYear, setup.weeks);
    const finalWeekNumber = schedule.weeks.reduce((max, week)=>Math.max(max, week.weekNumber), 0);
    // Reserve every headlined matchup so no two cards front the same pair.
    const usedPairs = new Set();
    const bestUnusedGame = (week, filter)=>{
        const pool = (filter ? week.games.filter(filter) : week.games).filter((game)=>!usedPairs.has(pairKey(game)));
        if (!pool.length) return undefined;
        return pool.find((game)=>game.gameNumber === 1) ?? [
            ...pool
        ].sort((left, right)=>(left.matchupRating ?? Infinity) - (right.matchupRating ?? Infinity))[0];
    };
    const byRating = (games)=>[
            ...games
        ].sort((a, b)=>(a.matchupRating ?? Infinity) - (b.matchupRating ?? Infinity));
    const bestGame = (week)=>week.games.find((game)=>game.gameNumber === 1) ?? byRating(week.games)[0];
    const core = [
        {
            key: "kickoff",
            order: 0,
            holdMs: 1900,
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__["Sparkles"], {
                "aria-hidden": "true"
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                lineNumber: 321,
                columnNumber: 13
            }, this),
            art: "/reveal/reveal-title.jpg",
            kicker: `${setup.seasonYear} season`,
            value: setup.name || "Your league",
            caption: "Every week, weighed and woven into one season…"
        },
        {
            key: "window",
            order: 10,
            holdMs: 3600,
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2d$days$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CalendarDays$3e$__["CalendarDays"], {
                "aria-hidden": "true"
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                lineNumber: 328,
                columnNumber: 13
            }, this),
            art: "/reveal/reveal-window.jpg",
            kicker: "Season window",
            value: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "reveal-window",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "reveal-window-weeks",
                        children: [
                            setup.weeks,
                            " weeks"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                        lineNumber: 332,
                        columnNumber: 11
                    }, this),
                    milestones && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "reveal-window-range",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "reveal-window-date",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("em", {
                                        children: "Kickoff"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                        lineNumber: 336,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                        children: milestones.kickoff.date
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                        lineNumber: 336,
                                        columnNumber: 33
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                        children: [
                                            "Week ",
                                            milestones.kickoff.week
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                        lineNumber: 336,
                                        columnNumber: 65
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                lineNumber: 335,
                                columnNumber: 15
                            }, this),
                            milestones.thanksgiving && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__["ArrowRight"], {
                                        className: "reveal-window-arrow",
                                        "aria-hidden": "true"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                        lineNumber: 340,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "reveal-window-date reveal-window-date-tg",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("em", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$flame$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Flame$3e$__["Flame"], {
                                                        "aria-hidden": "true"
                                                    }, void 0, false, {
                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                                        lineNumber: 342,
                                                        columnNumber: 25
                                                    }, this),
                                                    "Thanksgiving"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                                lineNumber: 342,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                                children: milestones.thanksgiving.date
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                                lineNumber: 342,
                                                columnNumber: 70
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                children: [
                                                    "Week ",
                                                    milestones.thanksgiving.week
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                                lineNumber: 342,
                                                columnNumber: 107
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                        lineNumber: 341,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__["ArrowRight"], {
                                className: "reveal-window-arrow",
                                "aria-hidden": "true"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                lineNumber: 346,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "reveal-window-date",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("em", {
                                        children: "Final week"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                        lineNumber: 348,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                        children: milestones.finalWeek.date
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                        lineNumber: 348,
                                        columnNumber: 36
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                        children: [
                                            "Week ",
                                            milestones.finalWeek.week
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                        lineNumber: 348,
                                        columnNumber: 70
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                lineNumber: 347,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                        lineNumber: 334,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                lineNumber: 331,
                columnNumber: 9
            }, this),
            caption: `${setup.seasonYear} season · real NFL week windows`
        },
        {
            key: "field",
            order: 20,
            holdMs: 3600,
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__["Users"], {
                "aria-hidden": "true"
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                lineNumber: 358,
                columnNumber: 13
            }, this),
            kicker: "The field",
            value: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "reveal-field",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "reveal-field-count",
                        children: [
                            setup.teams.length,
                            " teams · ",
                            setup.divisions.length,
                            " division",
                            setup.divisions.length === 1 ? "" : "s"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                        lineNumber: 362,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "reveal-field-divs",
                        children: setup.divisions.map((division)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "reveal-field-div",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "reveal-field-div-name",
                                        style: {
                                            color: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$colorContrast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["accessibleAccentColor"])(division.color)
                                        },
                                        children: division.name
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                        lineNumber: 366,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "reveal-field-div-teams",
                                        children: setup.teams.filter((team)=>team.divisionId === division.id).map((team)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: crest(team, 34)
                                            }, team.id, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                                lineNumber: 368,
                                                columnNumber: 96
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                        lineNumber: 367,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, division.id, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                                lineNumber: 365,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                        lineNumber: 363,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                lineNumber: 361,
                columnNumber: 9
            }, this),
            caption: `${totalGames} matchups mapped`
        }
    ];
    // Marquee: the single strongest matchup of the season — always shown.
    const marqueeWeek = schedule.weeks.find((week)=>week.matchupRank === 1) ?? schedule.weeks[0];
    const marqueeGame = marqueeWeek ? bestUnusedGame(marqueeWeek) : undefined;
    if (marqueeWeek && marqueeGame) {
        const home = teamById(marqueeGame.homeTeamId);
        const away = teamById(marqueeGame.awayTeamId);
        if (home && away) {
            usedPairs.add(pairKey(marqueeGame));
            core.push({
                key: "marquee",
                order: 40,
                holdMs: 3400,
                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$swords$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Swords$3e$__["Swords"], {
                    "aria-hidden": "true"
                }, void 0, false, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                    lineNumber: 389,
                    columnNumber: 15
                }, this),
                kicker: "One to circle",
                value: matchup(marqueeGame, {
                    size: 112,
                    gotw: true,
                    venue: true
                }),
                caption: `Week ${marqueeWeek.weekNumber} · ${marqueeGame.dateLabel ?? marqueeWeek.dateLabel}`,
                wash: [
                    home.color,
                    away.color
                ]
            });
        }
    }
    const extras = [];
    const pushSlate = (key, order, priority, icon, kicker, week, headliner, restLimit, captionSuffix)=>{
        if (!week || !headliner) return;
        const rest = byRating(week.games.filter((game)=>game.id !== headliner.id));
        const value = slateValue(headliner, rest, restLimit);
        const home = teamById(headliner.homeTeamId);
        const away = teamById(headliner.awayTeamId);
        if (!value || !home || !away) return;
        usedPairs.add(pairKey(headliner));
        extras.push({
            key,
            order,
            priority,
            holdMs: 5200,
            icon,
            kicker,
            value,
            caption: `Week ${week.weekNumber} · ${captionSuffix}`,
            wash: [
                home.color,
                away.color
            ]
        });
    };
    // A/B/C — the slate cards: a headliner plus a truncated view of that week's lineup.
    const openingWeek = schedule.weeks.find((week)=>week.weekNumber === 1);
    if (openingWeek) {
        pushSlate("opening", 30, setup.fairness.prioritizeOpeningWeek ? 1 : 8, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$flag$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Flag$3e$__["Flag"], {
            "aria-hidden": "true"
        }, void 0, false, {
            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
            lineNumber: 417,
            columnNumber: 76
        }, this), "Opening kickoff", openingWeek, bestGame(openingWeek), 2, "Game of the Week + the openers");
    }
    const thanksgivingNumber = safeThanksgivingWeek(setup.seasonYear, setup.weeks);
    const thanksgivingWeek = thanksgivingNumber ? schedule.weeks.find((week)=>week.weekNumber === thanksgivingNumber) : undefined;
    if (thanksgivingWeek) {
        pushSlate("thanksgiving", 55, setup.fairness.prioritizeThanksgiving ? 2 : 9, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$flame$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Flame$3e$__["Flame"], {
            "aria-hidden": "true"
        }, void 0, false, {
            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
            lineNumber: 422,
            columnNumber: 82
        }, this), "Thanksgiving spotlight", thanksgivingWeek, bestUnusedGame(thanksgivingWeek), 3, "Holiday headliner + the slate");
    }
    const closerWeek = schedule.weeks.find((week)=>week.weekNumber === finalWeekNumber);
    if (closerWeek) {
        pushSlate("closer", 80, setup.fairness.finalWeekDivisional ? 3 : 10, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trophy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trophy$3e$__["Trophy"], {
            "aria-hidden": "true"
        }, void 0, false, {
            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
            lineNumber: 426,
            columnNumber: 74
        }, this), "The closer", closerWeek, bestUnusedGame(closerWeek), 3, "Game of the Week + the finale slate");
    }
    // D/E/F — the stat cards (replay recap only, so the first-run reel stays celebratory).
    const gauntlet = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$revealStats$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toughestGauntlet"])(schedule, 4);
    const gauntletTeam = gauntlet && teamById(gauntlet.teamId);
    if (gauntlet && gauntletTeam) {
        extras.push({
            key: "gauntlet",
            order: 60,
            priority: 5,
            replayOnly: true,
            holdMs: 4200,
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$route$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Route$3e$__["Route"], {
                "aria-hidden": "true"
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                lineNumber: 435,
                columnNumber: 13
            }, this),
            kicker: "The gauntlet",
            value: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "reveal-solo",
                children: [
                    crest(gauntletTeam, 84),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                        style: {
                            color: gauntletTeam.color
                        },
                        children: teamLabel(gauntletTeam.id)
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                        lineNumber: 437,
                        columnNumber: 69
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "reveal-seed",
                        children: [
                            "#",
                            gauntletTeam.overallRank
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                        lineNumber: 437,
                        columnNumber: 142
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                lineNumber: 437,
                columnNumber: 14
            }, this),
            caption: `Weeks ${gauntlet.startWeek}–${gauntlet.endWeek} at ${listify(gauntlet.opponentRanks.map((rank)=>`#${rank}`))} — the season's toughest stretch`,
            wash: [
                gauntletTeam.color,
                gauntletTeam.color
            ]
        });
    }
    const sos = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$revealStats$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["strengthOfSchedule"])(schedule);
    const hardestTeam = sos.hardest && teamById(sos.hardest.teamId);
    const easiestTeam = sos.easiest && teamById(sos.easiest.teamId);
    if (sos.hardest && sos.easiest && hardestTeam && easiestTeam) {
        extras.push({
            key: "sos",
            order: 65,
            priority: 6,
            replayOnly: true,
            holdMs: 5000,
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gauge$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Gauge$3e$__["Gauge"], {
                "aria-hidden": "true"
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                lineNumber: 449,
                columnNumber: 13
            }, this),
            kicker: "Strength of schedule",
            value: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "reveal-rows",
                children: [
                    statLine("Toughest road", [
                        hardestTeam
                    ], `#${hardestTeam.overallRank} ${teamLabel(hardestTeam.id)}`, `avg opponent #${sos.hardest.avgOpponentRank.toFixed(1)}`, "hard"),
                    statLine("Smoothest ride", [
                        easiestTeam
                    ], `#${easiestTeam.overallRank} ${teamLabel(easiestTeam.id)}`, `avg opponent #${sos.easiest.avgOpponentRank.toFixed(1)}`, "easy")
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                lineNumber: 452,
                columnNumber: 9
            }, this),
            caption: "Based on every opponent's overall ranking"
        });
    }
    const gaps = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$revealStats$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["divisionSeriesGaps"])(schedule);
    const longA = gaps.longest && teamById(gaps.longest.aId);
    const longB = gaps.longest && teamById(gaps.longest.bId);
    const closeA = gaps.closest && teamById(gaps.closest.aId);
    const closeB = gaps.closest && teamById(gaps.closest.bId);
    if (gaps.longest && gaps.closest && longA && longB && closeA && closeB) {
        extras.push({
            key: "gaps",
            order: 70,
            priority: 7,
            replayOnly: true,
            holdMs: 5200,
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeftRight$3e$__["ArrowLeftRight"], {
                "aria-hidden": "true"
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                lineNumber: 469,
                columnNumber: 13
            }, this),
            kicker: "Rematch spacing",
            value: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "reveal-rows",
                children: [
                    statLine("Longest wait", [
                        longA,
                        longB
                    ], `#${longA.overallRank} ${longA.name} & #${longB.overallRank} ${longB.name}`, `Wk ${gaps.longest.first} → Wk ${gaps.longest.last}`, "long"),
                    statLine("Quickest rematch", [
                        closeA,
                        closeB
                    ], `#${closeA.overallRank} ${closeA.name} & #${closeB.overallRank} ${closeB.name}`, `Wk ${gaps.closest.first} & ${gaps.closest.last}`, "close")
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
                lineNumber: 472,
                columnNumber: 9
            }, this),
            caption: "How far apart divisional pairs meet twice"
        });
    }
    // In the lean first-run reveal, keep only the two highest-priority celebratory
    // beats (no stat cards). The replay recap shows the full set.
    const chosenExtras = mode === "replay" ? extras : extras.filter((scene)=>!scene.replayOnly).sort((a, b)=>(a.priority ?? 99) - (b.priority ?? 99)).slice(0, 2);
    const finale = {
        key: "ready",
        order: 100,
        holdMs: 0,
        finale: true,
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__["Sparkles"], {
            "aria-hidden": "true"
        }, void 0, false, {
            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx",
            lineNumber: 489,
            columnNumber: 11
        }, this),
        art: "/reveal/reveal-finale.jpg",
        kicker: mode === "replay" ? "That's the season" : "Kickoff",
        value: mode === "replay" ? "Your season, in full" : "Your season is ready",
        caption: mode === "replay" ? "Tap Replay to run it back, or close to explore." : "Open your commissioner workspace to explore every week."
    };
    return [
        ...core,
        ...chosenExtras,
        finale
    ].sort((left, right)=>left.order - right.order);
}
function seasonMilestones(seasonYear, weeks) {
    try {
        const dateOf = (week)=>monthDay.format(new Date((0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$schedule$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getNflWeekWindow"])(seasonYear, week).startsAt));
        const thanksgivingWeek = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$schedule$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getNflWeeks"])(seasonYear, weeks).find((week)=>week.holidays.includes("Thanksgiving"))?.week;
        return {
            kickoff: {
                week: 1,
                date: dateOf(1)
            },
            thanksgiving: thanksgivingWeek ? {
                week: thanksgivingWeek,
                date: dateOf(thanksgivingWeek)
            } : undefined,
            finalWeek: {
                week: weeks,
                date: dateOf(weeks)
            }
        };
    } catch  {
        return undefined;
    }
}
function safeThanksgivingWeek(seasonYear, weeks) {
    try {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$schedule$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getNflWeeks"])(seasonYear, weeks).find((week)=>week.holidays.includes("Thanksgiving"))?.week;
    } catch  {
        return undefined;
    }
}
function listify(items) {
    if (items.length <= 1) return items.join("");
    if (items.length === 2) return `${items[0]} & ${items[1]}`;
    return `${items.slice(0, -1).join(", ")} & ${items[items.length - 1]}`;
}
}),
"[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LeagueBuilder",
    ()=>LeagueBuilder
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-left.mjs [app-ssr] (ecmascript) <export default as ArrowLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-right.mjs [app-ssr] (ecmascript) <export default as ArrowRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2d$days$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CalendarDays$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/calendar-days.mjs [app-ssr] (ecmascript) <export default as CalendarDays>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/check.mjs [app-ssr] (ecmascript) <export default as Check>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CircleAlert$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-alert.mjs [app-ssr] (ecmascript) <export default as CircleAlert>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$spreadsheet$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileSpreadsheet$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/file-spreadsheet.mjs [app-ssr] (ecmascript) <export default as FileSpreadsheet>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$grip$2d$vertical$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__GripVertical$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/grip-vertical.mjs [app-ssr] (ecmascript) <export default as GripVertical>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$image$2d$plus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ImagePlus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/image-plus.mjs [app-ssr] (ecmascript) <export default as ImagePlus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/info.mjs [app-ssr] (ecmascript) <export default as Info>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bookmark$2d$plus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__BookmarkPlus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/bookmark-plus.mjs [app-ssr] (ecmascript) <export default as BookmarkPlus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$in$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LogIn$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/log-in.mjs [app-ssr] (ecmascript) <export default as LogIn>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$medal$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Medal$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/medal.mjs [app-ssr] (ecmascript) <export default as Medal>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pencil$2d$ruler$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__PencilRuler$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/pencil-ruler.mjs [app-ssr] (ecmascript) <export default as PencilRuler>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$minus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Minus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/minus.mjs [app-ssr] (ecmascript) <export default as Minus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/plus.mjs [app-ssr] (ecmascript) <export default as Plus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/refresh-cw.mjs [app-ssr] (ecmascript) <export default as RefreshCw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldCheck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield-check.mjs [app-ssr] (ecmascript) <export default as ShieldCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/sparkles.mjs [app-ssr] (ecmascript) <export default as Sparkles>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trophy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trophy$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trophy.mjs [app-ssr] (ecmascript) <export default as Trophy>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/users.mjs [app-ssr] (ecmascript) <export default as Users>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wand$2d$sparkles$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__WandSparkles$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/wand-sparkles.mjs [app-ssr] (ecmascript) <export default as WandSparkles>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.mjs [app-ssr] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUp$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-up.mjs [app-ssr] (ecmascript) <export default as ArrowUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$down$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-down.mjs [app-ssr] (ecmascript) <export default as ArrowDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$up$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronUp$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-up.mjs [app-ssr] (ecmascript) <export default as ChevronUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.mjs [app-ssr] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-right.mjs [app-ssr] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/rotate-ccw.mjs [app-ssr] (ecmascript) <export default as RotateCcw>");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$imports$2f$ImportLeagueModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/components/imports/ImportLeagueModal.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$account$2f$AuthModalProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/components/account/AuthModalProvider.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/supabase/client.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$CustomSelect$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/components/ui/CustomSelect.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$Modal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/components/ui/Modal.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$IdentityColorPicker$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/components/ui/IdentityColorPicker.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$EntityLogo$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/components/ui/EntityLogo.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$Tooltip$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/components/ui/Tooltip.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$defaults$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/defaults.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$savedLeagues$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/savedLeagues.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$schedule$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/schedule.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/storage.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/monograms.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$colorContrast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/colorContrast.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$rankings$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/rankings.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$playoffs$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/playoffs.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$teamIdentity$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/teamIdentity.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$builder$2f$GenerationReveal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/components/builder/GenerationReveal.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
const STEPS = [
    {
        label: "Start",
        shortLabel: "Start"
    },
    {
        label: "League",
        shortLabel: "League"
    },
    {
        label: "Teams",
        shortLabel: "Teams"
    },
    {
        label: "Divisions",
        shortLabel: "Divisions"
    },
    {
        label: "Season",
        shortLabel: "Season"
    },
    {
        label: "Seeding",
        shortLabel: "Seeding"
    },
    {
        label: "Week 1 Ranking",
        shortLabel: "Week 1"
    },
    {
        label: "Schedule Rules",
        shortLabel: "Rules"
    },
    {
        label: "Playoffs",
        shortLabel: "Playoffs"
    },
    {
        label: "Review & Generate",
        shortLabel: "Review"
    }
];
function setupLogoEntries(setup) {
    return [
        [
            "league",
            setup.logoUrl
        ],
        ...setup.divisions.map((division)=>[
                `division:${division.id}`,
                division.logoUrl
            ]),
        ...setup.teams.map((team)=>[
                `team:${team.id}`,
                team.logoUrl
            ]),
        [
            "playoffs",
            setup.playoffs.logoUrl
        ],
        ...(setup.playoffs.roundLogoUrls ?? []).map((logoUrl, index)=>[
                `playoff-round:${index}`,
                logoUrl
            ]),
        ...Object.entries(setup.playoffs.gameLogoUrls ?? {}).map(([gameId, logoUrl])=>[
                `playoff-game:${gameId}`,
                logoUrl
            ])
    ].filter((entry)=>Boolean(entry[1]));
}
function savedLogoEntries(identity) {
    if (!identity) return [];
    return [
        [
            "league",
            identity.league.logoUrl
        ],
        ...identity.divisions.map((division)=>[
                `division:${division.id}`,
                division.logoUrl
            ]),
        ...identity.teams.map((team)=>[
                `team:${team.id}`,
                team.logoUrl
            ]),
        [
            "playoffs",
            identity.playoffs?.logoUrl
        ],
        ...(identity.playoffs?.roundLogoUrls ?? []).map((logoUrl, index)=>[
                `playoff-round:${index}`,
                logoUrl
            ]),
        ...Object.entries(identity.playoffs?.gameLogoUrls ?? {}).map(([gameId, logoUrl])=>[
                `playoff-game:${gameId}`,
                logoUrl
            ])
    ].filter((entry)=>Boolean(entry[1]));
}
function logoFingerprint(setup) {
    return JSON.stringify(setupLogoEntries(setup).sort(([left], [right])=>left.localeCompare(right)));
}
function FieldLabel({ children, hint }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
        className: "field-label",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: children
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 111,
                columnNumber: 7
            }, this),
            hint && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                children: hint
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 112,
                columnNumber: 16
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
        lineNumber: 110,
        columnNumber: 5
    }, this);
}
function Toggle({ checked, onChange, label, description, disabled = false }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
        className: `toggle-row ${disabled ? "disabled" : ""}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: label
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 127,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                        children: description
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 128,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 126,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                type: "checkbox",
                checked: checked,
                disabled: disabled,
                onChange: (event)=>onChange(event.target.checked)
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 130,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {
                "aria-hidden": "true"
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 131,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
        lineNumber: 125,
        columnNumber: 5
    }, this);
}
function FieldSwitch({ checked, onChange, label }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
        className: "field-switch",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                type: "checkbox",
                checked: checked,
                onChange: (event)=>onChange(event.target.checked)
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 137,
                columnNumber: 42
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {
                "aria-hidden": "true"
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 137,
                columnNumber: 138
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: label
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 137,
                columnNumber: 162
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
        lineNumber: 137,
        columnNumber: 10
    }, this);
}
function connectedLabel(preset) {
    const provider = preset.data.platformConnection?.provider;
    if (!provider) return null;
    return provider === "espn" ? "ESPN connected" : "Sleeper connected";
}
function formatSavedLeagueDate(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString(undefined, {
        month: "short",
        year: "numeric"
    });
}
function SavedLeagueRow({ preset, latest, onChoose }) {
    const league = preset.data.league;
    const connection = connectedLabel(preset);
    const updated = formatSavedLeagueDate(preset.updatedAt);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        type: "button",
        className: "saved-league-row",
        style: {
            "--row-accent": league.color
        },
        onClick: ()=>onChoose(preset),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$EntityLogo$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EntityLogo"], {
                size: 32,
                color: league.color,
                logoUrl: league.logoUrl,
                monogram: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveInitials"])(league.initials, (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["leagueAcronym"])(league.name))
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 158,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "saved-league-row-who",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: [
                            league.name || preset.name,
                            latest && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "saved-league-recency",
                                children: "Last used"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 160,
                                columnNumber: 56
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 160,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                        children: [
                            preset.data.teams.length,
                            " teams · ",
                            preset.data.divisions.length,
                            " divisions",
                            connection ? ` · ${connection}` : ""
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 161,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 159,
                columnNumber: 7
            }, this),
            updated && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "saved-league-when",
                children: [
                    "Updated · ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                        children: updated
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 163,
                        columnNumber: 65
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 163,
                columnNumber: 19
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "saved-league-load-cue",
                children: [
                    "Load",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                        "aria-hidden": "true"
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 164,
                        columnNumber: 51
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 164,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
        lineNumber: 157,
        columnNumber: 5
    }, this);
}
// Step 2's picker only ever *resumes* a saved league. Doing nothing here and
// filling in the form below is how a new league is started, so there is no
// "new league" button. First-timers (no presets) see nothing at all.
function SavedLeagueShortcut({ presets, loadedPreset, onChoose, onStartFresh }) {
    const [expanded, setExpanded] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    if (!presets.length) return null;
    if (loadedPreset) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "saved-league-shortcut saved-league-loaded",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "saved-league-loaded-check",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                        "aria-hidden": "true"
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 178,
                        columnNumber: 53
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                    lineNumber: 178,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "saved-league-loaded-copy",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                            children: loadedPreset.data.league.name || loadedPreset.name
                        }, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                            lineNumber: 180,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                            children: "Teams, divisions, colors & logos loaded — edit below, or continue to Season."
                        }, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                            lineNumber: 181,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                    lineNumber: 179,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    className: "saved-league-startfresh",
                    onClick: onStartFresh,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__["RotateCcw"], {
                            "aria-hidden": "true"
                        }, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                            lineNumber: 183,
                            columnNumber: 90
                        }, this),
                        "Start fresh instead"
                    ]
                }, void 0, true, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                    lineNumber: 183,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
            lineNumber: 177,
            columnNumber: 7
        }, this);
    }
    const [latest, ...rest] = presets;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "saved-league-shortcut",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "saved-league-resume-head",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: "Continue a saved league"
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 190,
                        columnNumber: 49
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "or ignore this and start fresh below"
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 190,
                        columnNumber: 89
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 190,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "saved-league-rows",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SavedLeagueRow, {
                        preset: latest,
                        latest: true,
                        onChoose: onChoose
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 192,
                        columnNumber: 9
                    }, this),
                    expanded && rest.map((preset)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SavedLeagueRow, {
                            preset: preset,
                            onChoose: onChoose
                        }, preset.id, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                            lineNumber: 193,
                            columnNumber: 43
                        }, this))
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 191,
                columnNumber: 7
            }, this),
            rest.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                className: "saved-league-disclosure",
                "aria-expanded": expanded,
                onClick: ()=>setExpanded((value)=>!value),
                children: [
                    expanded ? "Show fewer" : `Other saved leagues (${rest.length})`,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                        "aria-hidden": "true"
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 197,
                        columnNumber: 77
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 196,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
        lineNumber: 189,
        columnNumber: 5
    }, this);
}
function SourceStep({ onManual, onImport }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "step-stack",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "section-heading",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "step-kicker",
                        children: "Step 1 of 10"
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 208,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        children: "How do you want to enter your data?"
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 209,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: "Build from scratch, or bring in your teams from ESPN, Sleeper, or a CSV. You’ll confirm every step before we generate the schedule."
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 210,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 207,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "source-step start-grid",
                role: "group",
                "aria-label": "Choose how to enter your league data",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "start-option start-option--main",
                        onClick: onManual,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "start-option-icon",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pencil$2d$ruler$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__PencilRuler$3e$__["PencilRuler"], {
                                    "aria-hidden": "true"
                                }, void 0, false, {
                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                    lineNumber: 214,
                                    columnNumber: 47
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 214,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "start-option-copy",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Start manually"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 216,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                        children: "Build a clean league from scratch. We’ll walk you through every step."
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 217,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 215,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "start-option-go",
                                "aria-hidden": "true",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__["ArrowRight"], {}, void 0, false, {
                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                    lineNumber: 219,
                                    columnNumber: 64
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 219,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 213,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "start-divider",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "or bring in your league"
                        }, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                            lineNumber: 221,
                            columnNumber: 40
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 221,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "start-import-row",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "start-option",
                                onClick: ()=>onImport("espn"),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "start-option-icon import-icon espn",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                            src: "/providers/espn.png",
                                            alt: ""
                                        }, void 0, false, {
                                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                            lineNumber: 224,
                                            columnNumber: 66
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 224,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "start-option-copy",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: "Connect ESPN"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 226,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                children: "Prefill teams from your ESPN league."
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 227,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 225,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 223,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "start-option",
                                onClick: ()=>onImport("sleeper"),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "start-option-icon import-icon sleeper",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                            src: "/providers/sleeper.png",
                                            alt: ""
                                        }, void 0, false, {
                                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                            lineNumber: 231,
                                            columnNumber: 69
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 231,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "start-option-copy",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: "Connect Sleeper"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 233,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                children: "Pull teams from the read-only Sleeper API."
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 234,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 232,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 230,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "start-option",
                                onClick: ()=>onImport("csv"),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "start-option-icon",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$spreadsheet$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileSpreadsheet$3e$__["FileSpreadsheet"], {
                                            "aria-hidden": "true"
                                        }, void 0, false, {
                                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                            lineNumber: 238,
                                            columnNumber: 49
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 238,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "start-option-copy",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: "CSV or paste"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 240,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                children: "Upload a file or paste a roster. Template included."
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 241,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 239,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 237,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 222,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 212,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
        lineNumber: 206,
        columnNumber: 5
    }, this);
}
function LeagueStep({ setup, setSetup, presets, loadedPreset, onQuickImport, onStartFresh, onLeagueLogoUploaded }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "step-stack",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "section-heading",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "step-kicker",
                        children: "Step 2 of 10"
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 254,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        children: "Start with your league."
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 255,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: presets.length ? "Pick up where you left off, or just fill in the form to start fresh." : "Name it, then set its colors and logo."
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 256,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 253,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SavedLeagueShortcut, {
                presets: presets,
                loadedPreset: loadedPreset,
                onChoose: onQuickImport,
                onStartFresh: onStartFresh
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 258,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "field-grid two-col",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FieldLabel, {
                                hint: "Required",
                                children: "League name"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 261,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                className: "text-input",
                                value: setup.name,
                                maxLength: 80,
                                onChange: (event)=>{
                                    const name = event.target.value;
                                    setSetup((current)=>({
                                            ...current,
                                            name,
                                            abbreviation: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["leagueAcronym"])(name)
                                        }));
                                }
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 262,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 260,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FieldLabel, {
                                hint: "Optional · max 4",
                                children: "Initials override"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 265,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                className: "text-input",
                                value: setup.initials ?? "",
                                maxLength: 4,
                                placeholder: `Auto: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["leagueAcronym"])(setup.name)}`,
                                onChange: (event)=>setSetup((current)=>({
                                            ...current,
                                            initials: event.target.value || undefined
                                        }))
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 266,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 264,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 259,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FieldLabel, {
                        hint: `${setup.description.length}/220`,
                        children: "League description"
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 270,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                        className: "text-input textarea",
                        maxLength: 220,
                        value: setup.description,
                        onChange: (event)=>setSetup((current)=>({
                                    ...current,
                                    description: event.target.value
                                }))
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 271,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 269,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "brand-row",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$IdentityColorPicker$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["IdentityColorPicker"], {
                        name: "League",
                        abbreviation: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveInitials"])(setup.initials, (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["leagueAcronym"])(setup.name)),
                        color: setup.color,
                        logoUrl: setup.logoUrl,
                        onChange: (next)=>{
                            if (next.logoUrl && next.logoUrl !== setup.logoUrl) onLeagueLogoUploaded(next.logoUrl);
                            setSetup((current)=>({
                                    ...current,
                                    ...next
                                }));
                        }
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 274,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "image-color-note",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__["Sparkles"], {}, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 284,
                                columnNumber: 43
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Logo-aware colors"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 284,
                                        columnNumber: 61
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                        children: "Upload a logo to choose from its three strongest colors or use a custom swatch."
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 284,
                                        columnNumber: 95
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 284,
                                columnNumber: 55
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 284,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 273,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
        lineNumber: 252,
        columnNumber: 5
    }, this);
}
function TeamsStep({ setup, setSetup, showErrors }) {
    const updateTeam = (id, patch)=>setSetup((current)=>({
                ...current,
                teams: current.teams.map((team)=>{
                    if (team.id !== id) return team;
                    const next = {
                        ...team,
                        ...patch
                    };
                    return {
                        ...next,
                        shortName: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveInitials"])(next.initials, (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["entityMonogram"])(next.name, next.city))
                    };
                })
            }));
    const setTeamCount = (count)=>{
        const next = Math.max(8, Math.min(16, count + count % 2));
        setSetup((current)=>({
                ...current,
                teams: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$defaults$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createTeams"])(next, current.divisions),
                priorSeason: {
                    ...current.priorSeason,
                    enabled: false,
                    hasData: false,
                    entryMode: "none"
                }
            }));
    };
    const updateDisplay = (patch)=>setSetup((current)=>({
                ...current,
                display: {
                    ...current.display,
                    ...patch
                }
            }));
    const teamColumns = [
        "74px",
        setup.display.cityNames && "112px",
        "minmax(145px,1.2fr)",
        "72px",
        setup.display.managers && "118px",
        setup.display.venues && "minmax(140px,1fr)"
    ].filter(Boolean).join(" ");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "step-stack",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "section-heading",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "step-kicker",
                        children: "Step 3 of 10"
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 308,
                        columnNumber: 40
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        children: "Add every team."
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 308,
                        columnNumber: 89
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: "Confirm team identities now. You’ll organize divisions on the next step."
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 308,
                        columnNumber: 113
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 308,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "team-details-stage",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "team-meta-controls",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FieldLabel, {
                                        children: "Teams"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 310,
                                        columnNumber: 50
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "stepper",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                "aria-label": "Remove two teams",
                                                onClick: ()=>setTeamCount(setup.teams.length - 2),
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$minus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Minus$3e$__["Minus"], {}, void 0, false, {
                                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                    lineNumber: 310,
                                                    columnNumber: 210
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 310,
                                                columnNumber: 105
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: setup.teams.length
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 310,
                                                columnNumber: 228
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                "aria-label": "Add two teams",
                                                onClick: ()=>setTeamCount(setup.teams.length + 2),
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {}, void 0, false, {
                                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                    lineNumber: 310,
                                                    columnNumber: 367
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 310,
                                                columnNumber: 265
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 310,
                                        columnNumber: 80
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 310,
                                columnNumber: 45
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FieldLabel, {
                                        children: "Optional team details"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 310,
                                        columnNumber: 401
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "field-switches",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FieldSwitch, {
                                                checked: setup.display.cityNames,
                                                onChange: (cityNames)=>updateDisplay({
                                                        cityNames
                                                    }),
                                                label: "City names"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 310,
                                                columnNumber: 479
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FieldSwitch, {
                                                checked: setup.display.managers,
                                                onChange: (managers)=>updateDisplay({
                                                        managers
                                                    }),
                                                label: "Managers"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 310,
                                                columnNumber: 602
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FieldSwitch, {
                                                checked: setup.display.venues,
                                                onChange: (venues)=>updateDisplay({
                                                        venues
                                                    }),
                                                label: "Venues"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 310,
                                                columnNumber: 720
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 310,
                                        columnNumber: 447
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 310,
                                columnNumber: 396
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 310,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "team-editor-table",
                        style: {
                            "--team-columns": teamColumns
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "team-editor-head",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Identity"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 312,
                                        columnNumber: 45
                                    }, this),
                                    setup.display.cityNames && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "City"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 312,
                                        columnNumber: 94
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Team name"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 312,
                                        columnNumber: 112
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Initials"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 312,
                                        columnNumber: 134
                                    }, this),
                                    setup.display.managers && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Manager"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 312,
                                        columnNumber: 182
                                    }, this),
                                    setup.display.venues && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Home venue"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 312,
                                        columnNumber: 228
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 312,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "team-editor-list",
                                children: setup.teams.map((team)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "team-editor-row",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$IdentityColorPicker$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["IdentityColorPicker"], {
                                                compact: true,
                                                name: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$teamIdentity$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["teamDisplayName"])(team, setup.display.cityNames),
                                                abbreviation: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$teamIdentity$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["teamInitials"])(team),
                                                color: team.color,
                                                logoUrl: team.logoUrl,
                                                onChange: (next)=>updateTeam(team.id, next)
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 314,
                                                columnNumber: 13
                                            }, this),
                                            setup.display.cityNames && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "team-editor-field",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "City"
                                                    }, void 0, false, {
                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                        lineNumber: 315,
                                                        columnNumber: 78
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        "aria-label": `Team ${team.overallRank} city`,
                                                        placeholder: "City",
                                                        value: team.city,
                                                        onChange: (event)=>updateTeam(team.id, {
                                                                city: event.target.value
                                                            })
                                                    }, void 0, false, {
                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                        lineNumber: 315,
                                                        columnNumber: 95
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 315,
                                                columnNumber: 41
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "team-editor-field",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "Team name"
                                                    }, void 0, false, {
                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                        lineNumber: 316,
                                                        columnNumber: 50
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        "aria-label": `Team ${team.overallRank} name`,
                                                        "aria-invalid": showErrors && !team.name.trim(),
                                                        placeholder: "Team name",
                                                        value: team.name,
                                                        onChange: (event)=>updateTeam(team.id, {
                                                                name: event.target.value
                                                            })
                                                    }, void 0, false, {
                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                        lineNumber: 316,
                                                        columnNumber: 72
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 316,
                                                columnNumber: 13
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "team-editor-field",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "Initials"
                                                    }, void 0, false, {
                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                        lineNumber: 317,
                                                        columnNumber: 50
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        "aria-label": `${(0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$teamIdentity$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["teamDisplayName"])(team)} initials override`,
                                                        maxLength: 4,
                                                        placeholder: `Auto: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["entityMonogram"])(team.name, team.city)}`,
                                                        value: team.initials ?? "",
                                                        onChange: (event)=>updateTeam(team.id, {
                                                                initials: event.target.value || undefined
                                                            })
                                                    }, void 0, false, {
                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                        lineNumber: 317,
                                                        columnNumber: 71
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 317,
                                                columnNumber: 13
                                            }, this),
                                            setup.display.managers && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "team-editor-field",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "Manager"
                                                    }, void 0, false, {
                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                        lineNumber: 318,
                                                        columnNumber: 77
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        "aria-label": `${(0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$teamIdentity$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["teamDisplayName"])(team)} manager`,
                                                        placeholder: "Manager",
                                                        value: team.manager,
                                                        onChange: (event)=>updateTeam(team.id, {
                                                                manager: event.target.value
                                                            })
                                                    }, void 0, false, {
                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                        lineNumber: 318,
                                                        columnNumber: 97
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 318,
                                                columnNumber: 40
                                            }, this),
                                            setup.display.venues && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "team-editor-field",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "Home venue"
                                                    }, void 0, false, {
                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                        lineNumber: 319,
                                                        columnNumber: 75
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        "aria-label": `${(0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$teamIdentity$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["teamDisplayName"])(team)} venue`,
                                                        placeholder: "Home venue",
                                                        value: team.stadium,
                                                        onChange: (event)=>updateTeam(team.id, {
                                                                stadium: event.target.value
                                                            })
                                                    }, void 0, false, {
                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                        lineNumber: 319,
                                                        columnNumber: 98
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 319,
                                                columnNumber: 38
                                            }, this)
                                        ]
                                    }, team.id, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 313,
                                        columnNumber: 72
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 313,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 311,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 309,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
        lineNumber: 307,
        columnNumber: 5
    }, this);
}
function DivisionsStep({ setup, setSetup, showErrors }) {
    const setDivisionCount = (count)=>{
        const divisions = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$defaults$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createDivisions"])(count);
        setSetup((current)=>({
                ...current,
                divisions,
                teams: current.teams.map((team, index)=>({
                        ...team,
                        divisionId: divisions[index % count].id
                    })),
                playoffs: {
                    ...current.playoffs,
                    placementMode: "auto",
                    fieldStatus: "live",
                    lockedTeamIds: []
                }
            }));
    };
    const updateDivision = (id, patch)=>setSetup((current)=>({
                ...current,
                divisions: current.divisions.map((division)=>division.id === id ? {
                        ...division,
                        ...patch
                    } : division)
            }));
    const updateTeam = (id, divisionId)=>setSetup((current)=>({
                ...current,
                teams: current.teams.map((team)=>team.id === id ? {
                        ...team,
                        divisionId
                    } : team)
            }));
    const counts = setup.divisions.map((division)=>setup.teams.filter((team)=>team.divisionId === division.id).length);
    const balanced = Math.max(...counts) - Math.min(...counts) <= 1;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "step-stack",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "section-heading",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "step-kicker",
                        children: "Step 4 of 10"
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 342,
                        columnNumber: 38
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        children: "Build the divisions."
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 342,
                        columnNumber: 87
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: "Name each group, keep its color and logo visible, then place every team."
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 342,
                        columnNumber: 116
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 342,
                columnNumber: 5
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "division-stage",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "compact-controls division-controls",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FieldLabel, {
                                        children: "Divisions"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 344,
                                        columnNumber: 64
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "segmented",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                className: setup.divisions.length === 2 ? "active" : "",
                                                onClick: ()=>setDivisionCount(2),
                                                children: "2"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 344,
                                                columnNumber: 125
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                className: setup.divisions.length === 3 ? "active" : "",
                                                onClick: ()=>setDivisionCount(3),
                                                children: "3"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 344,
                                                columnNumber: 250
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                className: setup.divisions.length === 4 ? "active" : "",
                                                onClick: ()=>setDivisionCount(4),
                                                children: "4"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 344,
                                                columnNumber: 375
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 344,
                                        columnNumber: 98
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 344,
                                columnNumber: 59
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `roster-status ${balanced ? "" : "warning"}`,
                                children: [
                                    balanced ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {}, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 344,
                                        columnNumber: 586
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CircleAlert$3e$__["CircleAlert"], {}, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 344,
                                        columnNumber: 598
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: balanced ? "Balanced divisions" : "Divisions need rebalancing"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 344,
                                                columnNumber: 620
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                children: [
                                                    counts.join(" · "),
                                                    " teams"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 344,
                                                columnNumber: 701
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 344,
                                        columnNumber: 614
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 344,
                                columnNumber: 512
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 344,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "division-strip",
                        children: setup.divisions.map((division)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "division-identity-edit",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$IdentityColorPicker$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["IdentityColorPicker"], {
                                        compact: true,
                                        name: `${division.name} division`,
                                        abbreviation: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveInitials"])(division.initials, (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["divisionAcronym"])(division.name)),
                                        color: division.color,
                                        logoUrl: division.logoUrl,
                                        onChange: (next)=>updateDivision(division.id, next)
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 345,
                                        columnNumber: 132
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                "aria-label": `${division.name} division name`,
                                                "aria-invalid": showErrors && !division.name.trim(),
                                                value: division.name,
                                                onChange: (event)=>updateDivision(division.id, {
                                                        name: event.target.value
                                                    })
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 345,
                                                columnNumber: 390
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                "aria-label": `${division.name} division initials override`,
                                                maxLength: 4,
                                                placeholder: `Auto: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["divisionAcronym"])(division.name)}`,
                                                value: division.initials ?? "",
                                                onChange: (event)=>updateDivision(division.id, {
                                                        initials: event.target.value || undefined
                                                    })
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 345,
                                                columnNumber: 598
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 345,
                                        columnNumber: 385
                                    }, this)
                                ]
                            }, division.id, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 345,
                                columnNumber: 74
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 345,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "division-assignments",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "division-assign-head",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Place each team"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 346,
                                        columnNumber: 83
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Keep each division within one team of the others."
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 346,
                                        columnNumber: 115
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 346,
                                columnNumber: 45
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: setup.teams.map((team)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "division-assign-row",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$EntityLogo$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EntityLogo"], {
                                                color: team.color,
                                                logoUrl: team.logoUrl,
                                                monogram: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$teamIdentity$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["teamInitials"])(team)
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 346,
                                                columnNumber: 266
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: [
                                                    setup.display.cityNames && team.city && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                        className: "team-city",
                                                        children: team.city
                                                    }, void 0, false, {
                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                        lineNumber: 346,
                                                        columnNumber: 399
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        children: team.name
                                                    }, void 0, false, {
                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                        lineNumber: 346,
                                                        columnNumber: 448
                                                    }, this),
                                                    setup.display.managers && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                        children: team.manager || "No manager"
                                                    }, void 0, false, {
                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                        lineNumber: 346,
                                                        columnNumber: 503
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 346,
                                                columnNumber: 352
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$CustomSelect$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CustomSelect"], {
                                                label: `${(0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$teamIdentity$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["teamDisplayName"])(team)} division`,
                                                value: team.divisionId,
                                                onChange: (divisionId)=>updateTeam(team.id, divisionId),
                                                options: setup.divisions.map((division)=>({
                                                        value: division.id,
                                                        label: division.name,
                                                        swatch: division.color,
                                                        logoUrl: division.logoUrl,
                                                        monogram: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveInitials"])(division.initials, (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["divisionAcronym"])(division.name))
                                                    }))
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 346,
                                                columnNumber: 556
                                            }, this)
                                        ]
                                    }, team.id, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 346,
                                        columnNumber: 215
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 346,
                                columnNumber: 183
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 346,
                        columnNumber: 7
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 343,
                columnNumber: 5
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
        lineNumber: 341,
        columnNumber: 10
    }, this);
}
function SeasonStep({ setup, setSetup }) {
    const weeks = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$schedule$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getNflWeeks"])(setup.seasonYear, setup.weeks);
    const divisionSizes = setup.divisions.map((division)=>setup.teams.filter((team)=>team.divisionId === division.id).length);
    const requiresFourteenWeeks = setup.divisions.length === 3 && setup.teams.length === 10 || divisionSizes.some((size)=>2 * (size - 1) > 13 || size % 2 === 1 && 13 < 2 * size);
    const setRegularSeasonWeeks = (regularSeasonWeeks)=>setSetup((current)=>{
            const maximumFieldSize = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$playoffs$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getMaximumPlayoffFieldSize"])(current.teams.length, regularSeasonWeeks, current.playoffs.bracketType);
            return {
                ...current,
                weeks: regularSeasonWeeks,
                playoffs: {
                    ...current.playoffs,
                    fieldSize: Math.min(current.playoffs.fieldSize, maximumFieldSize),
                    fieldStatus: "live",
                    lockedTeamIds: [],
                    roundNames: undefined
                }
            };
        });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (requiresFourteenWeeks && setup.weeks === 13) setRegularSeasonWeeks(14);
    }, [
        requiresFourteenWeeks,
        setSetup,
        setup.weeks
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "step-stack",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "section-heading",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "step-kicker",
                        children: "Step 5 of 10"
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 374,
                        columnNumber: 40
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        children: "Frame the season."
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 374,
                        columnNumber: 89
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: "League Weaver uses real NFL week windows for the regular season."
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 374,
                        columnNumber: 115
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 374,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "field-grid two-col season-controls",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FieldLabel, {
                                children: "Regular-season length"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 376,
                                columnNumber: 14
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "choice-row",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        disabled: requiresFourteenWeeks,
                                        className: setup.weeks === 13 ? "active" : "",
                                        onClick: ()=>setRegularSeasonWeeks(13),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: "13 weeks"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 376,
                                                columnNumber: 232
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                children: requiresFourteenWeeks ? "Unavailable for this division shape" : "Compact regular season"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 376,
                                                columnNumber: 257
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 376,
                                        columnNumber: 88
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: setup.weeks === 14 ? "active" : "",
                                        onClick: ()=>setRegularSeasonWeeks(14),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: "14 weeks"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 376,
                                                columnNumber: 482
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                children: "Extra regular-season week"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 376,
                                                columnNumber: 507
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 376,
                                        columnNumber: 371
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 376,
                                columnNumber: 60
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 376,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FieldLabel, {
                                children: "NFL season"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 377,
                                columnNumber: 14
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$CustomSelect$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CustomSelect"], {
                                label: "NFL season",
                                value: String(setup.seasonYear),
                                onChange: (seasonYear)=>setSetup((current)=>({
                                            ...current,
                                            seasonYear: Number(seasonYear)
                                        })),
                                options: [
                                    2025,
                                    2026,
                                    2027
                                ].map((year)=>({
                                        value: String(year),
                                        label: `${year} season`,
                                        description: year === 2026 ? "Current planning year" : "NFL week calendar"
                                    }))
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 377,
                                columnNumber: 49
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 377,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 375,
                columnNumber: 7
            }, this),
            requiresFourteenWeeks && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "info-callout",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__["Info"], {}, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 379,
                        columnNumber: 63
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: "Fourteen weeks keeps this shape complete."
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 379,
                                columnNumber: 77
                            }, this),
                            " This division layout needs the extra week so every divisional opponent can play twice without byes."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 379,
                        columnNumber: 71
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 379,
                columnNumber: 33
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "week-window",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "week-window-head",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2d$days$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CalendarDays$3e$__["CalendarDays"], {}, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 381,
                                        columnNumber: 49
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: [
                                            setup.seasonYear,
                                            " fantasy week windows"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 381,
                                        columnNumber: 65
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 381,
                                columnNumber: 43
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                children: "Tuesday 4:00 AM ET rollover"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 381,
                                columnNumber: 128
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 381,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "week-chip-grid",
                        children: weeks.map((week)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: week.holidays.length ? "holiday" : "",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: [
                                            "W",
                                            week.week
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 382,
                                        columnNumber: 134
                                    }, this),
                                    week.label.replace(`, ${setup.seasonYear}`, ""),
                                    week.holidays.map((holiday)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("em", {
                                            children: holiday
                                        }, holiday, false, {
                                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                            lineNumber: 382,
                                            columnNumber: 244
                                        }, this))
                                ]
                            }, week.week, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 382,
                                columnNumber: 62
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 382,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 380,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
        lineNumber: 373,
        columnNumber: 5
    }, this);
}
function SeedingStep({ setup, setSetup }) {
    const [draggedTeamId, setDraggedTeamId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const rankedTeams = [
        ...setup.teams
    ].sort((left, right)=>left.overallRank - right.overallRank || left.id.localeCompare(right.id));
    const moveTeam = (teamId, nextIndex)=>{
        const ordered = [
            ...rankedTeams
        ];
        const currentIndex = ordered.findIndex((team)=>team.id === teamId);
        if (currentIndex < 0) return;
        const [team] = ordered.splice(currentIndex, 1);
        ordered.splice(Math.max(0, Math.min(ordered.length, nextIndex)), 0, team);
        setSetup((current)=>({
                ...current,
                teams: ordered.map((item, index)=>({
                        ...item,
                        overallRank: index + 1
                    }))
            }));
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "step-stack",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "section-heading",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "step-kicker",
                        children: "Step 6 of 10"
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 400,
                        columnNumber: 38
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        children: "Set last season’s order."
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 400,
                        columnNumber: 87
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: "Seeding is optional. Use it only when prior-season results should shape cross-division matchups."
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 400,
                        columnNumber: 120
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 400,
                columnNumber: 5
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "seeding-methods",
                role: "group",
                "aria-label": "Seeding method",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: setup.priorSeason.entryMode === "manual" ? "active" : "",
                        onClick: ()=>setSetup((current)=>({
                                    ...current,
                                    priorSeason: {
                                        ...current.priorSeason,
                                        enabled: true,
                                        entryMode: "manual"
                                    }
                                })),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$grip$2d$vertical$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__GripVertical$3e$__["GripVertical"], {}, void 0, false, {
                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                    lineNumber: 402,
                                    columnNumber: 237
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 402,
                                columnNumber: 231
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: "Enter order manually"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 402,
                                columnNumber: 260
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                children: "Recommended for most leagues. Drag teams or choose each rank."
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 402,
                                columnNumber: 297
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 402,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        disabled: !setup.priorSeason.hasData,
                        className: setup.priorSeason.entryMode === "history" && setup.priorSeason.source === "playoffs" ? "active" : "",
                        onClick: ()=>setSetup((current)=>({
                                    ...current,
                                    priorSeason: {
                                        ...current.priorSeason,
                                        enabled: true,
                                        entryMode: "history",
                                        source: "playoffs"
                                    }
                                })),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trophy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trophy$3e$__["Trophy"], {}, void 0, false, {
                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                    lineNumber: 403,
                                    columnNumber: 340
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 403,
                                columnNumber: 334
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: "Last year’s playoff finish"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 403,
                                columnNumber: 357
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                children: setup.priorSeason.hasData ? "Use imported or saved playoff placement." : "No imported history available."
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 403,
                                columnNumber: 400
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 403,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        disabled: !setup.priorSeason.hasData,
                        className: setup.priorSeason.entryMode === "history" && setup.priorSeason.source === "regular-season" ? "active" : "",
                        onClick: ()=>setSetup((current)=>({
                                    ...current,
                                    priorSeason: {
                                        ...current.priorSeason,
                                        enabled: true,
                                        entryMode: "history",
                                        source: "regular-season"
                                    }
                                })),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$medal$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Medal$3e$__["Medal"], {}, void 0, false, {
                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                    lineNumber: 404,
                                    columnNumber: 352
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 404,
                                columnNumber: 346
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: "Last year’s regular season"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 404,
                                columnNumber: 368
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                children: setup.priorSeason.hasData ? "Use imported or saved final standings." : "No imported history available."
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 404,
                                columnNumber: 411
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 404,
                        columnNumber: 7
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 401,
                columnNumber: 5
            }, this),
            !setup.priorSeason.hasData && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "info-callout gold",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__["Info"], {}, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 406,
                        columnNumber: 71
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: "Manual order is ready."
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 406,
                                columnNumber: 85
                            }, this),
                            " League history was not imported, so the two automatic choices stay unavailable."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 406,
                        columnNumber: 79
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 406,
                columnNumber: 36
            }, this),
            setup.priorSeason.entryMode !== "none" && setup.priorSeason.enabled && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "ranking-editor",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "ranking-head",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "step-kicker",
                                        children: [
                                            setup.seasonYear - 1,
                                            " ",
                                            setup.priorSeason.entryMode === "manual" ? "manual order" : setup.priorSeason.source === "playoffs" ? "playoff finish" : "regular-season finish"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 408,
                                        columnNumber: 42
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        children: "Slot teams into their final rank."
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 408,
                                        columnNumber: 248
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: "Drag a row or choose its number. Rank 1 is last season’s strongest finish."
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 408,
                                        columnNumber: 290
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 408,
                                columnNumber: 37
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    rankedTeams.length,
                                    " teams"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 408,
                                columnNumber: 377
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 408,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "ranking-list",
                        role: "list",
                        "aria-label": "Prior-season team ranking",
                        children: rankedTeams.map((team, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `ranking-row ${draggedTeamId === team.id ? "dragging" : ""}`,
                                role: "listitem",
                                draggable: true,
                                onDragStart: ()=>setDraggedTeamId(team.id),
                                onDragEnd: ()=>setDraggedTeamId(null),
                                onDragOver: (event)=>event.preventDefault(),
                                onDrop: ()=>{
                                    if (draggedTeamId) moveTeam(draggedTeamId, index);
                                    setDraggedTeamId(null);
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$grip$2d$vertical$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__GripVertical$3e$__["GripVertical"], {
                                        className: "ranking-grip",
                                        "aria-hidden": "true"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 411,
                                        columnNumber: 11
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$CustomSelect$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CustomSelect"], {
                                        label: `${(0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$teamIdentity$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["teamDisplayName"])(team)} rank`,
                                        value: String(index + 1),
                                        onChange: (value)=>moveTeam(team.id, Number(value) - 1),
                                        options: rankedTeams.map((_, optionIndex)=>({
                                                value: String(optionIndex + 1),
                                                label: `#${optionIndex + 1}`,
                                                description: optionIndex === 0 ? "Strongest finish" : optionIndex === rankedTeams.length - 1 ? "Last-place finish" : "Prior-season order"
                                            }))
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 412,
                                        columnNumber: 11
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$EntityLogo$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EntityLogo"], {
                                        className: "ranking-mark",
                                        color: team.color,
                                        logoUrl: team.logoUrl,
                                        monogram: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$teamIdentity$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["teamInitials"])(team)
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 413,
                                        columnNumber: 11
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "ranking-team",
                                        children: [
                                            setup.display.cityNames && team.city && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                className: "team-city",
                                                children: team.city
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 414,
                                                columnNumber: 83
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: team.name
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 414,
                                                columnNumber: 132
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                children: [
                                                    setup.display.managers ? `${team.manager || "No manager"} · ` : "",
                                                    setup.divisions.find((division)=>division.id === team.divisionId)?.name || "No division"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 414,
                                                columnNumber: 160
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 414,
                                        columnNumber: 11
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "ranking-actions",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$Tooltip$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Tooltip"], {
                                                label: "Move up",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    "aria-label": `Move ${(0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$teamIdentity$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["teamDisplayName"])(team)} up`,
                                                    disabled: index === 0,
                                                    onClick: ()=>moveTeam(team.id, index - 1),
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUp$3e$__["ArrowUp"], {}, void 0, false, {
                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                        lineNumber: 415,
                                                        columnNumber: 208
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                    lineNumber: 415,
                                                    columnNumber: 70
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 415,
                                                columnNumber: 45
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$Tooltip$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Tooltip"], {
                                                label: "Move down",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    "aria-label": `Move ${(0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$teamIdentity$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["teamDisplayName"])(team)} down`,
                                                    disabled: index === rankedTeams.length - 1,
                                                    onClick: ()=>moveTeam(team.id, index + 1),
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$down$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowDown$3e$__["ArrowDown"], {}, void 0, false, {
                                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                        lineNumber: 415,
                                                        columnNumber: 426
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                    lineNumber: 415,
                                                    columnNumber: 265
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 415,
                                                columnNumber: 238
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 415,
                                        columnNumber: 11
                                    }, this)
                                ]
                            }, team.id, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 410,
                                columnNumber: 43
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 409,
                        columnNumber: 7
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 407,
                columnNumber: 77
            }, this),
            setup.priorSeason.entryMode !== "none" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                className: "seeding-skip",
                onClick: ()=>setSetup((current)=>({
                            ...current,
                            priorSeason: {
                                ...current.priorSeason,
                                enabled: false,
                                entryMode: "none"
                            }
                        })),
                children: "Skip seeding for this season"
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 419,
                columnNumber: 48
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
        lineNumber: 399,
        columnNumber: 10
    }, this);
}
function OpeningWeekStep({ setup, setSetup }) {
    const orderedTeams = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$rankings$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getWeekOneTeamOrder"])(setup);
    const missingDraftPlaces = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$rankings$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getTeamsMissingDraftPlaces"])(setup);
    const selectedCount = setup.teams.length - missingDraftPlaces.length;
    const placeOptions = [
        {
            value: "unranked",
            label: "Not set",
            description: "Choose draft place"
        },
        ...setup.teams.map((_, index)=>({
                value: String(index + 1),
                label: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$rankings$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatDraftPlace"])(index + 1, setup.teams.length)
            }))
    ];
    const updatePlace = (teamId, value)=>setSetup((current)=>{
            const nextPlace = value === "unranked" ? undefined : Number(value);
            const currentTeam = current.teams.find((team)=>team.id === teamId);
            const previousPlace = currentTeam?.draftPlace;
            return {
                ...current,
                teams: current.teams.map((team)=>{
                    if (team.id === teamId) return {
                        ...team,
                        draftPlace: nextPlace
                    };
                    if (nextPlace && team.draftPlace === nextPlace) return {
                        ...team,
                        draftPlace: previousPlace
                    };
                    return team;
                })
            };
        });
    const chooseSource = (rankingSource)=>setSetup((current)=>({
                ...current,
                weekOne: {
                    rankingSource
                }
            }));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "step-stack",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "section-heading",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "step-kicker",
                        children: "Step 7 of 10"
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 443,
                        columnNumber: 38
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        children: "Rank the opening week."
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 443,
                        columnNumber: 87
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: "Choose what should shape Week 1 marquee matchups and the first Game of the Week."
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 443,
                        columnNumber: 118
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 443,
                columnNumber: 5
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "opening-rank-methods",
                role: "group",
                "aria-label": "Week 1 ranking source",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: setup.weekOne.rankingSource === "prior-season" ? "active" : "",
                        onClick: ()=>chooseSource("prior-season"),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$medal$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Medal$3e$__["Medal"], {}, void 0, false, {
                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                    lineNumber: 445,
                                    columnNumber: 155
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 445,
                                columnNumber: 149
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: "Last season’s finish"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 445,
                                columnNumber: 171
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                children: "Use the order from the Seeding step. This remains the recommended default."
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 445,
                                columnNumber: 208
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 445,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: setup.weekOne.rankingSource === "draft-day" ? "active" : "",
                        onClick: ()=>chooseSource("draft-day"),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$spreadsheet$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileSpreadsheet$3e$__["FileSpreadsheet"], {}, void 0, false, {
                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                    lineNumber: 446,
                                    columnNumber: 149
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 446,
                                columnNumber: 143
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: "Draft-day place"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 446,
                                columnNumber: 175
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                children: "Choose who drafted first through last to set the Week 1 order and Game of the Week."
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 446,
                                columnNumber: 207
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 446,
                        columnNumber: 7
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 444,
                columnNumber: 5
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "info-callout",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__["Info"], {}, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 448,
                        columnNumber: 35
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: "Only Week 1 changes."
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 448,
                                columnNumber: 49
                            }, this),
                            " Draft-day ranking does not replace last season’s finish for the rest of the schedule or playoff setup."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 448,
                        columnNumber: 43
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 448,
                columnNumber: 5
            }, this),
            setup.weekOne.rankingSource === "draft-day" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "draft-later-callout",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$spreadsheet$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileSpreadsheet$3e$__["FileSpreadsheet"], {}, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 449,
                        columnNumber: 90
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: selectedCount === 0 ? "No draft order yet? Skip it for now." : missingDraftPlaces.length ? "Finish every draft place before continuing." : "Draft ranking is ready."
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 449,
                                columnNumber: 115
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                children: selectedCount === 0 ? "Leave every team unranked and use “Skip draft rank for now.” The season workspace will remind you until Week 2 starts." : missingDraftPlaces.length ? `${missingDraftPlaces.length} team${missingDraftPlaces.length === 1 ? " still needs" : "s still need"} a unique place. Complete the order or clear every selection to skip it.` : "Every team has a unique place from first through last."
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 449,
                                columnNumber: 298
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 449,
                        columnNumber: 109
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 449,
                columnNumber: 53
            }, this),
            setup.weekOne.rankingSource === "draft-day" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "ranking-editor draft-ranking-editor",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "ranking-head",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "step-kicker",
                                        children: "Draft-day order"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 451,
                                        columnNumber: 42
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        children: "Place teams from first to last."
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 451,
                                        columnNumber: 94
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: "Choose each position once. Selecting an occupied place swaps the two teams."
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 451,
                                        columnNumber: 134
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 451,
                                columnNumber: 37
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    orderedTeams.length,
                                    " teams"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 451,
                                columnNumber: 222
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 451,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "draft-ranking-list",
                        role: "list",
                        "aria-label": "Draft-day team ranking",
                        children: orderedTeams.map((team, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "draft-ranking-row",
                                role: "listitem",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                        children: team.draftPlace ? `#${team.draftPlace}` : "—"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 453,
                                        columnNumber: 9
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$EntityLogo$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EntityLogo"], {
                                        color: team.color,
                                        logoUrl: team.logoUrl,
                                        monogram: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$teamIdentity$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["teamInitials"])(team)
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 454,
                                        columnNumber: 9
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            setup.display.cityNames && team.city && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                className: "team-city",
                                                children: team.city
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 455,
                                                columnNumber: 56
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: team.name
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 455,
                                                columnNumber: 105
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                children: setup.divisions.find((division)=>division.id === team.divisionId)?.name || "No division"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 455,
                                                columnNumber: 133
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 455,
                                        columnNumber: 9
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$CustomSelect$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CustomSelect"], {
                                        label: `${(0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$teamIdentity$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["teamDisplayName"])(team)} draft place`,
                                        value: team.draftPlace ? String(team.draftPlace) : "unranked",
                                        onChange: (value)=>updatePlace(team.id, value),
                                        options: placeOptions
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 456,
                                        columnNumber: 9
                                    }, this)
                                ]
                            }, team.id, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 452,
                                columnNumber: 126
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 452,
                        columnNumber: 7
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 450,
                columnNumber: 53
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
        lineNumber: 442,
        columnNumber: 10
    }, this);
}
function FairnessStep({ setup, setSetup }) {
    const update = (patch)=>setSetup((current)=>({
                ...current,
                fairness: {
                    ...current.fairness,
                    ...patch
                }
            }));
    const thanksgivingWeek = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$schedule$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getNflWeeks"])(setup.seasonYear, 14).find((week)=>week.holidays.includes("Thanksgiving"))?.week;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "step-stack",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "section-heading",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "step-kicker",
                        children: "Step 8 of 10"
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 467,
                        columnNumber: 40
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        children: "Set your schedule rules."
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 467,
                        columnNumber: 89
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: "Every rule is checked before the schedule is shown. These controls shape the feel and highlights of the season."
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 467,
                        columnNumber: 122
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 467,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rule-group",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rule-group-title",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldCheck$3e$__["ShieldCheck"], {}, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 469,
                                columnNumber: 43
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Ground rules"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 469,
                                        columnNumber: 64
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                        children: "Always applied to every schedule"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 469,
                                        columnNumber: 93
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 469,
                                columnNumber: 58
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 469,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Toggle, {
                        checked: setup.fairness.preventImmediateRematches,
                        onChange: (value)=>update({
                                preventImmediateRematches: value
                            }),
                        label: "Space out repeat opponents",
                        description: "Avoid playing the same team in consecutive weeks."
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 470,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "streak-control",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Maximum home or away streak"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 471,
                                        columnNumber: 47
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                        children: "Keep long runs from tilting the season."
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 471,
                                        columnNumber: 91
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 471,
                                columnNumber: 41
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "segmented",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: setup.fairness.maxHomeAwayStreak === 2 ? "active" : "",
                                        onClick: ()=>update({
                                                maxHomeAwayStreak: 2
                                            }),
                                        children: "2"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 471,
                                        columnNumber: 179
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: setup.fairness.maxHomeAwayStreak === 3 ? "active" : "",
                                        onClick: ()=>update({
                                                maxHomeAwayStreak: 3
                                            }),
                                        children: "3"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 471,
                                        columnNumber: 327
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: setup.fairness.maxHomeAwayStreak === 4 ? "active" : "",
                                        onClick: ()=>update({
                                                maxHomeAwayStreak: 4
                                            }),
                                        children: "4"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 471,
                                        columnNumber: 475
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 471,
                                columnNumber: 152
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 471,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 468,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rule-group",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rule-group-title",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trophy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trophy$3e$__["Trophy"], {}, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 474,
                                columnNumber: 43
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Season moments"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 474,
                                        columnNumber: 59
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                        children: "Preferences improve the shape, never invalidate it"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 474,
                                        columnNumber: 90
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 474,
                                columnNumber: 53
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 474,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Toggle, {
                        checked: setup.fairness.finalWeekDivisional,
                        onChange: (value)=>update({
                                finalWeekDivisional: value
                            }),
                        label: "Division-focused final week",
                        description: "Close with divisional matchups wherever the league shape allows."
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 475,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Toggle, {
                        checked: setup.fairness.prioritizeOpeningWeek,
                        onChange: (value)=>update({
                                prioritizeOpeningWeek: value
                            }),
                        label: "Strong opening week",
                        description: "Favor closely ranked matchups in Week 1."
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 476,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Toggle, {
                        checked: setup.fairness.prioritizeThanksgiving,
                        onChange: (value)=>update({
                                prioritizeThanksgiving: value
                            }),
                        label: `Thanksgiving spotlight${thanksgivingWeek ? ` · Week ${thanksgivingWeek}` : ""}`,
                        description: "Favor marquee matchups during the exact Tuesday-to-Tuesday holiday window."
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 477,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 473,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "info-callout gold",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__["Info"], {
                        size: 19
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 479,
                        columnNumber: 42
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: "Good to know."
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 479,
                                columnNumber: 66
                            }, this),
                            " Preferences help score valid schedules. They will never cause a valid league to fail generation."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 479,
                        columnNumber: 60
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 479,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
        lineNumber: 466,
        columnNumber: 5
    }, this);
}
function PlayoffsStep({ setup, setSetup }) {
    const p = setup.playoffs;
    const divisionCount = setup.divisions.length;
    const maxFieldSize = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$playoffs$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getMaximumPlayoffFieldSize"])(setup.teams.length, setup.weeks, p.bracketType);
    const patch = (next)=>setSetup((current)=>({
                ...current,
                playoffs: {
                    ...current.playoffs,
                    ...next
                }
            }));
    const setBracketType = (bracketType)=>{
        const max = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$playoffs$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getMaximumPlayoffFieldSize"])(setup.teams.length, setup.weeks, bracketType);
        patch({
            bracketType,
            fieldSize: Math.min(p.fieldSize, max),
            fieldStatus: "live",
            lockedTeamIds: []
        });
    };
    const setFieldSize = (fieldSize)=>{
        const halvesUsable = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$playoffs$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isPlayoffPlacementUsable"])("division-halves", divisionCount, fieldSize);
        patch({
            fieldSize,
            placementMode: p.placementMode === "division-halves" && !halvesUsable ? "auto" : p.placementMode,
            consolationMode: p.consolationMode === "division-halves" && !halvesUsable ? "standard" : p.consolationMode,
            thirdPlaceGame: p.consolationMode !== "off" && fieldSize >= 4,
            fieldStatus: "live",
            lockedTeamIds: []
        });
    };
    const setTheme = (theme)=>patch(theme === "custom" ? {
            theme
        } : {
            theme,
            color: __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$playoffs$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PLAYOFF_THEME_COLORS"][theme]
        });
    const setConsolation = (consolationMode)=>patch({
            consolationMode,
            thirdPlaceGame: consolationMode !== "off" && p.fieldSize >= 4
        });
    const byeCount = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$playoffs$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getPlayoffByeCount"])(p.fieldSize);
    const fieldSizeOptions = [];
    for(let n = 2; n <= maxFieldSize; n += 2)fieldSizeOptions.push(n);
    if (!fieldSizeOptions.includes(maxFieldSize)) fieldSizeOptions.push(maxFieldSize);
    const placementOptions = [
        {
            value: "auto",
            label: "Automatic",
            description: `Best fit for ${divisionCount} division${divisionCount === 1 ? "" : "s"}`
        },
        {
            value: "overall",
            label: "Overall standings",
            description: "Top teams qualify regardless of division"
        },
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$playoffs$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isPlayoffPlacementUsable"])("division-leaders", divisionCount, p.fieldSize) ? [
            {
                value: "division-leaders",
                label: "Division leaders protected",
                description: "Division winners seeded at the top"
            }
        ] : [],
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$playoffs$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isPlayoffPlacementUsable"])("division-halves", divisionCount, p.fieldSize) ? [
            {
                value: "division-halves",
                label: "Division halves",
                description: "Each half runs its own tournament to the final"
            }
        ] : []
    ];
    const consolationOptions = [
        {
            value: "off",
            label: "No consolation bracket",
            description: "Championship bracket only"
        },
        {
            value: "standard",
            label: "Standard placement",
            description: "Placement bracket for non-qualifiers"
        },
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$playoffs$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isPlayoffPlacementUsable"])("division-halves", divisionCount, p.fieldSize) ? [
            {
                value: "division-halves",
                label: "Division-halves placement",
                description: "Open inside the division, then cross over"
            }
        ] : []
    ];
    const themes = [
        "gold",
        "silver",
        "bronze",
        "custom"
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "step-stack",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "section-heading",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "step-kicker",
                        children: "Step 9 of 10"
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 533,
                        columnNumber: 38
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        children: "Shape the playoffs."
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 533,
                        columnNumber: 87
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: "Set the postseason field and format now. Round names, game names, and logos can still be personalized on the Playoffs page once the bracket is live."
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 533,
                        columnNumber: 115
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 533,
                columnNumber: 5
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "field-grid two-col playoff-setup-grid",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FieldLabel, {
                                hint: byeCount ? `${byeCount} bye${byeCount === 1 ? "" : "s"} for the top seed${byeCount === 1 ? "" : "s"}` : "Every qualifier opens play",
                                children: "Playoff teams"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 536,
                                columnNumber: 12
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$CustomSelect$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CustomSelect"], {
                                label: "Playoff field size",
                                value: String(p.fieldSize),
                                onChange: (value)=>setFieldSize(Number(value)),
                                options: fieldSizeOptions.map((n)=>({
                                        value: String(n),
                                        label: `${n} teams`,
                                        description: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$playoffs$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getPlayoffByeCount"])(n) ? `${(0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$playoffs$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getPlayoffByeCount"])(n)} bye${(0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$playoffs$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getPlayoffByeCount"])(n) === 1 ? "" : "s"}` : "No byes"
                                    }))
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 537,
                                columnNumber: 9
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 536,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FieldLabel, {
                                children: "Bracket format"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 539,
                                columnNumber: 12
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "choice-row",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: p.bracketType === "single-elimination" ? "active" : "",
                                        onClick: ()=>setBracketType("single-elimination"),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: "Single elimination"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 541,
                                                columnNumber: 153
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                children: "One-and-done bracket"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 541,
                                                columnNumber: 188
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 541,
                                        columnNumber: 11
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: p.bracketType === "ladder" ? "active" : "",
                                        onClick: ()=>setBracketType("ladder"),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: "Ladder"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 542,
                                                columnNumber: 129
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                children: "Lowest seeds climb each week"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 542,
                                                columnNumber: 152
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 542,
                                        columnNumber: 11
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 540,
                                columnNumber: 9
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 539,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FieldLabel, {
                                children: "Qualification"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 545,
                                columnNumber: 12
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$CustomSelect$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CustomSelect"], {
                                label: "Playoff qualification",
                                value: p.placementMode,
                                onChange: (value)=>patch({
                                        placementMode: value
                                    }),
                                options: placementOptions
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 546,
                                columnNumber: 9
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 545,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FieldLabel, {
                                children: "Reseeding"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 548,
                                columnNumber: 12
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$CustomSelect$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CustomSelect"], {
                                label: "Reseeding",
                                value: p.reseedMode,
                                onChange: (value)=>patch({
                                        reseedMode: value
                                    }),
                                options: [
                                    {
                                        value: "fixed",
                                        label: "Fixed bracket",
                                        description: "Winners follow set bracket paths"
                                    },
                                    {
                                        value: "each-round",
                                        label: "Reseed each round",
                                        description: "Top remaining seed always hosts the lowest"
                                    },
                                    {
                                        value: "protected",
                                        label: "Protected reseed",
                                        description: "Reseed while protecting bracket halves"
                                    }
                                ]
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 549,
                                columnNumber: 9
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 548,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FieldLabel, {
                                children: "Championship venue"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 555,
                                columnNumber: 12
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "choice-row",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: p.championshipVenueMode === "higher-seed" ? "active" : "",
                                        onClick: ()=>patch({
                                                championshipVenueMode: "higher-seed"
                                            }),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: "Higher seed hosts"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 557,
                                                columnNumber: 167
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                children: "Top seed keeps home field"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 557,
                                                columnNumber: 201
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 557,
                                        columnNumber: 11
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: p.championshipVenueMode === "neutral-site" ? "active" : "",
                                        onClick: ()=>patch({
                                                championshipVenueMode: "neutral-site"
                                            }),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: "Neutral site"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 558,
                                                columnNumber: 169
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                children: "Title game at a set venue"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 558,
                                                columnNumber: 198
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 558,
                                        columnNumber: 11
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 556,
                                columnNumber: 9
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 555,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FieldLabel, {
                                children: "Seed labels"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 561,
                                columnNumber: 12
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "choice-row",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: p.seedDisplayMode === "reranked" ? "active" : "",
                                        onClick: ()=>patch({
                                                seedDisplayMode: "reranked"
                                            }),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: "Bracket seeds"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 563,
                                                columnNumber: 149
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                children: "1…N by playoff seeding"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 563,
                                                columnNumber: 179
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 563,
                                        columnNumber: 11
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: p.seedDisplayMode === "standings-finish" ? "active" : "",
                                        onClick: ()=>patch({
                                                seedDisplayMode: "standings-finish"
                                            }),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: "Standings finish"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 564,
                                                columnNumber: 165
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                children: "Show regular-season place"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 564,
                                                columnNumber: 198
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 564,
                                        columnNumber: 11
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 562,
                                columnNumber: 9
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 561,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FieldLabel, {
                                children: "Consolation bracket"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 567,
                                columnNumber: 12
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$CustomSelect$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CustomSelect"], {
                                label: "Consolation bracket",
                                value: p.consolationMode,
                                onChange: (value)=>setConsolation(value),
                                options: consolationOptions
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 568,
                                columnNumber: 9
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 567,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FieldLabel, {
                                children: "Trophy theme"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 570,
                                columnNumber: 12
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "choice-row playoff-theme-row",
                                children: themes.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: p.theme === t ? "active" : "",
                                        onClick: ()=>setTheme(t),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "playoff-theme-swatch",
                                                style: {
                                                    background: t === "custom" ? p.color : __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$playoffs$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PLAYOFF_THEME_COLORS"][t]
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 572,
                                                columnNumber: 130
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: t.charAt(0).toUpperCase() + t.slice(1)
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 572,
                                                columnNumber: 246
                                            }, this)
                                        ]
                                    }, t, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 572,
                                        columnNumber: 30
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 571,
                                columnNumber: 9
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 570,
                        columnNumber: 7
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 535,
                columnNumber: 5
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "playoff-branding-row",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$IdentityColorPicker$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["IdentityColorPicker"], {
                        name: p.name || "Championship Playoffs",
                        abbreviation: "PO",
                        color: p.color,
                        logoUrl: p.logoUrl,
                        showColorControl: p.theme === "custom",
                        onChange: (next)=>patch({
                                ...p.theme === "custom" ? {
                                    color: next.color
                                } : {},
                                logoUrl: next.logoUrl
                            })
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 578,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "playoff-name-field",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FieldLabel, {
                                children: "Playoff name"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 579,
                                columnNumber: 43
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                "aria-label": "Playoff name",
                                value: p.name,
                                maxLength: 40,
                                placeholder: "Championship Playoffs",
                                onChange: (event)=>patch({
                                        name: event.target.value
                                    })
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 579,
                                columnNumber: 80
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 579,
                        columnNumber: 7
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 577,
                columnNumber: 5
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "info-callout",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__["Info"], {}, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 582,
                        columnNumber: 35
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: "Higher seed hosts every round before the championship."
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 582,
                                columnNumber: 49
                            }, this),
                            " ",
                            p.fieldSize,
                            " teams make the field",
                            byeCount ? `, with ${byeCount} first-round bye${byeCount === 1 ? "" : "s"}` : "",
                            "."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 582,
                        columnNumber: 43
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 582,
                columnNumber: 5
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
        lineNumber: 532,
        columnNumber: 10
    }, this);
}
function ReviewStep({ setup }) {
    const checks = [
        `${setup.teams.length} teams balanced across ${setup.divisions.length} divisions`,
        `${setup.weeks}-week season with one matchup per team each week`,
        `Week 1 ranked by ${setup.weekOne.rankingSource === "draft-day" ? (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$rankings$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["hasCompleteDraftRanking"])(setup) ? "draft-day place" : "draft-day place (set after the draft)" : "last season’s finish"}`,
        "Every divisional opponent scheduled twice",
        `Home and away streaks capped at ${setup.fairness.maxHomeAwayStreak}`
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "step-stack",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "section-heading",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "step-kicker",
                        children: "Step 10 of 10"
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 596,
                        columnNumber: 40
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        children: "Your league is ready to weave."
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 596,
                        columnNumber: 90
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: "One final check, then we’ll build the complete season."
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 596,
                        columnNumber: 129
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 596,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "review-banner",
                style: {
                    borderColor: setup.color
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$EntityLogo$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EntityLogo"], {
                        className: "review-mark",
                        size: 54,
                        color: setup.color,
                        logoUrl: setup.logoUrl,
                        monogram: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveInitials"])(setup.initials, (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["leagueAcronym"])(setup.name))
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 597,
                        columnNumber: 75
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    setup.seasonYear,
                                    " FANTASY SEASON"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 597,
                                columnNumber: 242
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                children: setup.name
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 597,
                                columnNumber: 288
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: setup.description
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 597,
                                columnNumber: 309
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 597,
                        columnNumber: 237
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 597,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "review-metrics",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: setup.teams.length
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 598,
                                columnNumber: 44
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Teams"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 598,
                                columnNumber: 81
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 598,
                        columnNumber: 39
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: setup.divisions.length
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 598,
                                columnNumber: 110
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Divisions"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 598,
                                columnNumber: 151
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 598,
                        columnNumber: 105
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: setup.weeks
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 598,
                                columnNumber: 184
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Weeks"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 598,
                                columnNumber: 214
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 598,
                        columnNumber: 179
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: setup.teams.length * setup.weeks / 2
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 598,
                                columnNumber: 243
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Matchups"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 598,
                                columnNumber: 298
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 598,
                        columnNumber: 238
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 598,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "validation-list",
                children: checks.map((check)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {}, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 599,
                                columnNumber: 80
                            }, this),
                            check
                        ]
                    }, check, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 599,
                        columnNumber: 63
                    }, this))
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 599,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "generation-note",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wand$2d$sparkles$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__WandSparkles$3e$__["WandSparkles"], {}, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 600,
                        columnNumber: 40
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: "Generation is deterministic and validated."
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 600,
                                columnNumber: 62
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                children: "We’ll check team frequency, matchup inventory, divisional balance, and home/away totals before showing the result."
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 600,
                                columnNumber: 121
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 600,
                        columnNumber: 56
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 600,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
        lineNumber: 595,
        columnNumber: 5
    }, this);
}
function previewDivisions(setup) {
    return setup.divisions.map((division)=>({
            ...division,
            teams: setup.teams.filter((team)=>team.divisionId === division.id)
        }));
}
function setupProgress(step) {
    return Math.round((step + 1) / STEPS.length * 100);
}
function BlueprintRoster({ setup }) {
    const divisions = previewDivisions(setup);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "preview-divisions",
        children: divisions.map((division)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "preview-division-title",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$EntityLogo$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EntityLogo"], {
                                className: "preview-division-mark",
                                color: division.color,
                                logoUrl: division.logoUrl,
                                monogram: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveInitials"])(division.initials, (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["divisionAcronym"])(division.name))
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 617,
                                columnNumber: 99
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: division.name
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 617,
                                columnNumber: 275
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                children: division.teams.length
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 617,
                                columnNumber: 307
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 617,
                        columnNumber: 59
                    }, this),
                    division.teams.map((team)=>{
                        const accent = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$colorContrast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["accessibleAccentColor"])(team.color);
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "preview-team",
                            title: `${(0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$teamIdentity$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["teamDisplayName"])(team, setup.display.cityNames)} · Rank ${team.overallRank}`,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$EntityLogo$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EntityLogo"], {
                                    color: team.color,
                                    logoUrl: team.logoUrl,
                                    monogram: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$teamIdentity$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["teamInitials"])(team)
                                }, void 0, false, {
                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                    lineNumber: 617,
                                    columnNumber: 571
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: [
                                        setup.display.cityNames && team.city && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                            className: "team-city",
                                            children: team.city
                                        }, void 0, false, {
                                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                            lineNumber: 617,
                                            columnNumber: 704
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            style: setup.display.cityNames ? {
                                                color: accent
                                            } : undefined,
                                            children: team.name
                                        }, void 0, false, {
                                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                            lineNumber: 617,
                                            columnNumber: 753
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                            children: [
                                                (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$teamIdentity$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["teamInitials"])(team),
                                                setup.display.managers ? team.manager || "No manager" : "",
                                                setup.display.venues ? team.stadium || "Venue TBD" : ""
                                            ].filter(Boolean).join(" · ")
                                        }, void 0, false, {
                                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                            lineNumber: 617,
                                            columnNumber: 845
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                    lineNumber: 617,
                                    columnNumber: 657
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                    style: {
                                        color: accent
                                    },
                                    children: [
                                        "#",
                                        team.overallRank
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                    lineNumber: 617,
                                    columnNumber: 1034
                                }, this)
                            ]
                        }, team.id, true, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                            lineNumber: 617,
                            columnNumber: 440
                        }, this);
                    })
                ]
            }, division.id, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 617,
                columnNumber: 36
            }, this))
    }, void 0, false, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
        lineNumber: 616,
        columnNumber: 5
    }, this);
}
function BuilderActionButtons({ step, generating, skipDraftRankForNow, back, next, generate }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                className: "button-secondary",
                onClick: back,
                disabled: generating,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__["ArrowLeft"], {}, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 634,
                        columnNumber: 95
                    }, this),
                    "Back"
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 634,
                columnNumber: 7
            }, this),
            step < STEPS.length - 1 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                className: "button-primary",
                onClick: next,
                children: [
                    skipDraftRankForNow ? "Skip draft rank for now" : "Continue",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__["ArrowRight"], {}, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 636,
                        columnNumber: 137
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 636,
                columnNumber: 11
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                className: "button-primary generate-button",
                onClick: generate,
                disabled: generating,
                children: generating ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "spinner"
                        }, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                            lineNumber: 637,
                            columnNumber: 133
                        }, this),
                        "Weaving schedule…"
                    ]
                }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__["Sparkles"], {}, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                            lineNumber: 637,
                            columnNumber: 186
                        }, this),
                        "Generate my season"
                    ]
                }, void 0, true)
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 637,
                columnNumber: 11
            }, this)
        ]
    }, void 0, true);
}
function LivePreview({ setup, step }) {
    if (step === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
            className: "builder-preview builder-preview-empty",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "preview-top",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "LEAGUE BLUEPRINT"
                        }, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                            lineNumber: 646,
                            columnNumber: 38
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("em", {
                            children: "LIVE"
                        }, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                            lineNumber: 646,
                            columnNumber: 67
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                    lineNumber: 646,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "preview-empty-body",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "preview-empty-mark",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wand$2d$sparkles$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__WandSparkles$3e$__["WandSparkles"], {}, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 648,
                                columnNumber: 48
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                            lineNumber: 648,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                            children: "Your blueprint builds here"
                        }, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                            lineNumber: 649,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            children: "Choose how to start below. As you add teams and divisions, they’ll appear here in real time."
                        }, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                            lineNumber: 650,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                    lineNumber: 647,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "preview-footer",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Setup progress"
                        }, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                            lineNumber: 652,
                            columnNumber: 41
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                            children: "0%"
                        }, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                            lineNumber: 652,
                            columnNumber: 68
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {
                                style: {
                                    width: "0%"
                                }
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 652,
                                columnNumber: 92
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                            lineNumber: 652,
                            columnNumber: 87
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                    lineNumber: 652,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
            lineNumber: 645,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
        className: "builder-preview",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "preview-top",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "LEAGUE BLUEPRINT"
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 658,
                        columnNumber: 36
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("em", {
                        children: "LIVE"
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 658,
                        columnNumber: 65
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 658,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "preview-brand",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$EntityLogo$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EntityLogo"], {
                        className: "preview-logo",
                        size: 50,
                        color: setup.color,
                        logoUrl: setup.logoUrl,
                        monogram: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveInitials"])(setup.initials, (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["leagueAcronym"])(setup.name))
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 659,
                        columnNumber: 38
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                children: setup.name || "Untitled league"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 659,
                                columnNumber: 206
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: [
                                    setup.seasonYear,
                                    " · ",
                                    setup.weeks,
                                    " weeks"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 659,
                                columnNumber: 248
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 659,
                        columnNumber: 201
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 659,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "preview-status",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__["Users"], {}, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 660,
                                columnNumber: 45
                            }, this),
                            setup.teams.length,
                            " teams"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 660,
                        columnNumber: 39
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2d$days$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CalendarDays$3e$__["CalendarDays"], {}, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 660,
                                columnNumber: 93
                            }, this),
                            setup.weeks,
                            " weeks"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 660,
                        columnNumber: 87
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldCheck$3e$__["ShieldCheck"], {}, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 660,
                                columnNumber: 141
                            }, this),
                            "Rules on"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 660,
                        columnNumber: 135
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 660,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(BlueprintRoster, {
                setup: setup
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 661,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "preview-footer",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "Setup progress"
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 662,
                        columnNumber: 39
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: [
                            setupProgress(step),
                            "%"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 662,
                        columnNumber: 66
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {
                            style: {
                                width: `${setupProgress(step)}%`
                            }
                        }, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                            lineNumber: 662,
                            columnNumber: 110
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 662,
                        columnNumber: 105
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 662,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
        lineNumber: 657,
        columnNumber: 5
    }, this);
}
// Tablet/mobile: the blueprint can't be a side rail, so it becomes a pinned bar
// merged with the Back/Continue actions. Collapsed by default, taps open a sheet
// with the full roster.
function BuilderBlueprintBar({ setup, step, open, onToggle, actions }) {
    if (step === 0) return null;
    const progress = setupProgress(step);
    const sheetId = "blueprint-bar-sheet";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            open && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "blueprint-bar-backdrop",
                role: "presentation",
                onMouseDown: onToggle
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 682,
                columnNumber: 16
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `builder-blueprint-bar${open ? " open" : ""}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        id: sheetId,
                        className: "blueprint-bar-sheet",
                        role: "region",
                        "aria-label": "League blueprint",
                        hidden: !open,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "preview-brand",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$EntityLogo$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EntityLogo"], {
                                        className: "preview-logo",
                                        size: 44,
                                        color: setup.color,
                                        logoUrl: setup.logoUrl,
                                        monogram: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveInitials"])(setup.initials, (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["leagueAcronym"])(setup.name))
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 685,
                                        columnNumber: 42
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                children: setup.name || "Untitled league"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 685,
                                                columnNumber: 210
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                children: [
                                                    setup.seasonYear,
                                                    " · ",
                                                    setup.weeks,
                                                    " weeks"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 685,
                                                columnNumber: 252
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 685,
                                        columnNumber: 205
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 685,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "preview-status",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__["Users"], {}, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 686,
                                                columnNumber: 49
                                            }, this),
                                            setup.teams.length,
                                            " teams"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 686,
                                        columnNumber: 43
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2d$days$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CalendarDays$3e$__["CalendarDays"], {}, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 686,
                                                columnNumber: 97
                                            }, this),
                                            setup.weeks,
                                            " weeks"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 686,
                                        columnNumber: 91
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldCheck$3e$__["ShieldCheck"], {}, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 686,
                                                columnNumber: 145
                                            }, this),
                                            "Rules on"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 686,
                                        columnNumber: 139
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 686,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(BlueprintRoster, {
                                setup: setup
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 687,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 684,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "blueprint-bar-progress",
                        "aria-hidden": "true",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {
                            style: {
                                width: `${progress}%`
                            }
                        }, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                            lineNumber: 689,
                            columnNumber: 68
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 689,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "blueprint-bar-row",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "blueprint-bar-toggle",
                                "aria-expanded": open,
                                "aria-controls": sheetId,
                                onClick: onToggle,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$EntityLogo$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EntityLogo"], {
                                        size: 30,
                                        color: setup.color,
                                        logoUrl: setup.logoUrl,
                                        monogram: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveInitials"])(setup.initials, (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["leagueAcronym"])(setup.name))
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 692,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: setup.name || "Untitled league"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 693,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                children: [
                                                    setup.teams.length,
                                                    " teams · ",
                                                    progress,
                                                    "% set up"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 693,
                                                columnNumber: 69
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 693,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$up$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronUp$3e$__["ChevronUp"], {
                                        className: `blueprint-bar-chevron${open ? " flip" : ""}`
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 694,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 691,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "blueprint-bar-actions",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(BuilderActionButtons, {
                                    ...actions
                                }, void 0, false, {
                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                    lineNumber: 696,
                                    columnNumber: 50
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 696,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 690,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 683,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
function LeagueBuilder() {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const { openSignIn } = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$account$2f$AuthModalProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuthModal"])();
    const [step, setStep] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const progressTrackRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const builderContentRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const stepMountedRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    const [setup, setSetup] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$defaults$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createDefaultSetup"]);
    const logoBaseline = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(new Map(setupLogoEntries(setup)));
    const [generating, setGenerating] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [blueprintOpen, setBlueprintOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [revealSeason, setRevealSeason] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [showFieldErrors, setShowFieldErrors] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [importSource, setImportSource] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [savedLeagues, setSavedLeagues] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [signedIn, setSignedIn] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    // Save-state messages are surfaced by the logo prompt / save prompt UI; the
    // raw string isn't rendered on its own, so only the setter is retained.
    const [, setLeagueSaveState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [activeSavedLeagueId, setActiveSavedLeagueId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loadedPreset, setLoadedPreset] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [connectedSavedLeaguePrompt, setConnectedSavedLeaguePrompt] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [logoSavePrompt, setLogoSavePrompt] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [logoSaveBusy, setLogoSaveBusy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [logoSaveError, setLogoSaveError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const dismissedLogoFingerprint = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [guestGenerateWarning, setGuestGenerateWarning] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    // The reuse loop is now seeded at generate: a signed-in commissioner who built
    // a brand-new league is offered to save it. Resolved once per league so a
    // repeat generate never nags.
    const [saveLeaguePrompt, setSaveLeaguePrompt] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [saveLeaguePromptBusy, setSaveLeaguePromptBusy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const savePromptResolved = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    const [hasAvatar, setHasAvatar] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [avatarNudge, setAvatarNudge] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [avatarNudgeState, setAvatarNudgeState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("idle");
    const avatarNudgeDismissed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    const startNewLeague = ()=>{
        const blankSetup = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$defaults$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createBlankSetup"])();
        setSetup(blankSetup);
        logoBaseline.current = new Map(setupLogoEntries(blankSetup));
        setActiveSavedLeagueId(null);
        setLoadedPreset(null);
        dismissedLogoFingerprint.current = null;
        savePromptResolved.current = false;
        setLeagueSaveState(null);
        setStep(1);
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (new URLSearchParams(window.location.search).get("start") === "new") {
            startNewLeague();
            const url = new URL(window.location.href);
            url.searchParams.delete("start");
            window.history.replaceState({}, "", url);
            return;
        }
        const stored = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["loadSetup"])();
        if (stored) setSetup(stored);
    }, []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["saveSetup"])(setup), [
        setup
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const track = progressTrackRef.current;
        const activeStep = track?.querySelector("button.active");
        if (!track || !activeStep || track.scrollWidth <= track.clientWidth) return;
        track.scrollTo({
            left: activeStep.offsetLeft - (track.clientWidth - activeStep.offsetWidth) / 2,
            behavior: "smooth"
        });
    }, [
        step
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        setShowFieldErrors(false);
        if (!stepMountedRef.current) {
            stepMountedRef.current = true;
            return;
        }
        builderContentRef.current?.focus({
            preventScroll: true
        });
    }, [
        step
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const loadAccountState = ()=>{
            fetch("/api/entitlements").then((response)=>response.json()).then((payload)=>{
                setSignedIn(Boolean(payload.signedIn));
                setHasAvatar(Boolean(payload.avatarUrl));
            }).catch(()=>undefined);
            fetch("/api/saved-leagues").then((response)=>response.json()).then((payload)=>{
                setSavedLeagues((payload.presets ?? []).map(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$savedLeagues$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizeSavedLeague"]).filter((preset)=>Boolean(preset)));
            }).catch(()=>undefined);
        };
        loadAccountState();
        // Keep the builder in sync when the user signs in/out via the modal without a page reload.
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createClient"])();
        const { data: listener } = supabase?.auth.onAuthStateChange(()=>loadAccountState()) ?? {
            data: null
        };
        return ()=>listener?.subscription.unsubscribe();
    }, []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!blueprintOpen) return;
        const onKey = (event)=>{
            if (event.key === "Escape") setBlueprintOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return ()=>window.removeEventListener("keydown", onKey);
    }, [
        blueprintOpen
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const importParam = new URLSearchParams(window.location.search).get("import");
        if (importParam !== "espn" && importParam !== "sleeper" && importParam !== "csv") return;
        setImportSource(importParam);
        const url = new URL(window.location.href);
        url.searchParams.delete("import");
        window.history.replaceState({}, "", url);
    }, []);
    const validationError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (step === 1 && !setup.name.trim()) return "Enter a league name before continuing.";
        if (step === 2) {
            if (setup.teams.length < 8 || setup.teams.length > 16 || setup.teams.length % 2) return "Use an even number of teams from 8 through 16.";
            const missingTeam = setup.teams.findIndex((team)=>!team.name.trim());
            if (missingTeam >= 0) return "Enter a name for every team before continuing — the missing one is highlighted below.";
        }
        if (step === 3) {
            if (setup.divisions.some((division)=>!division.name.trim())) return "Give every division a name before continuing.";
            if (setup.teams.some((team)=>!setup.divisions.some((division)=>division.id === team.divisionId))) return "Place every team in a division before continuing.";
            const counts = setup.divisions.map((division)=>setup.teams.filter((team)=>team.divisionId === division.id).length);
            if (Math.max(...counts) - Math.min(...counts) > 1) return `Rebalance the divisions. Current team counts are ${counts.join(", ")}.`;
        }
        if (step === 6 && setup.weekOne.rankingSource === "draft-day") {
            const selectedPlaces = setup.teams.filter((team)=>Number.isInteger(team.draftPlace));
            if (selectedPlaces.length > 0 && selectedPlaces.length < setup.teams.length) return `Finish the draft order for all ${setup.teams.length} teams, or clear every draft place to skip it for now.`;
            if (selectedPlaces.length === setup.teams.length && new Set(selectedPlaces.map((team)=>team.draftPlace)).size !== setup.teams.length) return "Give every team a unique draft place before continuing.";
        }
        return null;
    }, [
        setup,
        step
    ]);
    const advanceToStep = (nextStep)=>{
        setStep(Math.min(STEPS.length - 1, nextStep));
        setBlueprintOpen(false);
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };
    const matchingSavedLeague = ()=>savedLeagues.find((preset)=>preset.id === activeSavedLeagueId) ?? savedLeagues.find((preset)=>preset.name.trim().toLowerCase() === setup.name.trim().toLowerCase());
    function applySavedLeaguePreset(preset, includeConnection) {
        setSetup((current)=>({
                ...current,
                ...preset.data.league,
                display: preset.data.display,
                divisions: preset.data.divisions,
                teams: preset.data.teams,
                platformConnection: includeConnection ? preset.data.platformConnection : undefined,
                priorSeason: preset.data.priorSeason ?? {
                    ...current.priorSeason,
                    enabled: false,
                    hasData: false,
                    entryMode: "none"
                },
                playoffs: preset.data.playoffs ? {
                    ...current.playoffs,
                    ...preset.data.playoffs
                } : current.playoffs
            }));
        setActiveSavedLeagueId(preset.id);
        setLoadedPreset(preset);
        logoBaseline.current = new Map(savedLogoEntries(preset.data));
        dismissedLogoFingerprint.current = null;
        setConnectedSavedLeaguePrompt(null);
        // Stay on the League step and show the "loaded" confirm bar so the user can
        // eyeball the roster for churn before continuing — no silent jump to Season.
        setStep(1);
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
    const next = ()=>{
        if (validationError) {
            setError(validationError);
            setShowFieldErrors(true);
            requestAnimationFrame(()=>{
                const invalid = builderContentRef.current?.querySelector('[aria-invalid="true"]');
                if (invalid) {
                    invalid.scrollIntoView({
                        block: "center",
                        behavior: "smooth"
                    });
                    invalid.focus({
                        preventScroll: true
                    });
                }
            });
            return;
        }
        setError(null);
        setShowFieldErrors(false);
        const fingerprint = logoFingerprint(setup);
        const targetPreset = matchingSavedLeague();
        const savedLogos = new Map(savedLogoEntries(targetPreset?.data));
        const changedCount = setupLogoEntries(setup).filter(([key, logoUrl])=>logoBaseline.current.get(key) !== logoUrl && savedLogos.get(key) !== logoUrl).length;
        if (changedCount > 0 && dismissedLogoFingerprint.current !== fingerprint) {
            setLogoSaveError(null);
            setLogoSavePrompt({
                changedCount,
                fingerprint,
                nextStep: step + 1,
                presetId: targetPreset?.id,
                presetName: targetPreset?.name || setup.name || "this league"
            });
            return;
        }
        advanceToStep(step + 1);
    };
    const skipDraftRankForNow = step === 6 && setup.weekOne.rankingSource === "draft-day" && (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$rankings$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getTeamsMissingDraftPlaces"])(setup).length === setup.teams.length;
    const back = ()=>{
        setError(null);
        setStep((current)=>Math.max(0, current - 1));
        setBlueprintOpen(false);
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };
    const quickImportSavedLeague = (preset)=>{
        if (preset.data.platformConnection) {
            setConnectedSavedLeaguePrompt(preset);
            return;
        }
        applySavedLeaguePreset(preset, false);
    };
    // Soft nudge: a signed-in commissioner with no avatar just uploaded a league logo — offer it as their profile image.
    const suggestAvatarFromLogo = (logoUrl)=>{
        if (!logoUrl || !signedIn || hasAvatar || avatarNudgeDismissed.current) return;
        setAvatarNudgeState("idle");
        setAvatarNudge(logoUrl);
    };
    const dismissAvatarNudge = ()=>{
        avatarNudgeDismissed.current = true;
        setAvatarNudge(null);
    };
    const acceptAvatarNudge = async ()=>{
        if (!avatarNudge) return;
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createClient"])();
        if (!supabase) return;
        setAvatarNudgeState("saving");
        const { error } = await supabase.auth.updateUser({
            data: {
                avatar_url: avatarNudge
            }
        });
        if (error) {
            setAvatarNudgeState("idle");
            return;
        }
        setHasAvatar(true);
        avatarNudgeDismissed.current = true;
        setAvatarNudgeState("saved");
        window.setTimeout(()=>setAvatarNudge(null), 2200);
    };
    const saveLeaguePreset = async (requestedId)=>{
        if (!signedIn) {
            setLeagueSaveState("Sign in first, then this shortcut will stay with your account.");
            return false;
        }
        const targetId = requestedId ?? matchingSavedLeague()?.id;
        setLeagueSaveState("Saving…");
        try {
            const response = await fetch("/api/saved-leagues", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id: targetId,
                    name: setup.name,
                    data: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$savedLeagues$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["identityFromSetup"])(setup)
                })
            });
            const payload = await response.json();
            if (!response.ok || !payload.preset) throw new Error(payload.error || "This league could not be saved.");
            const normalized = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$savedLeagues$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizeSavedLeague"])(payload.preset);
            if (!normalized) throw new Error("The saved league response could not be read.");
            setSavedLeagues((current)=>[
                    normalized,
                    ...current.filter((preset)=>preset.id !== normalized.id)
                ]);
            setActiveSavedLeagueId(normalized.id);
            logoBaseline.current = new Map(setupLogoEntries(setup));
            dismissedLogoFingerprint.current = null;
            setLeagueSaveState(targetId ? "Saved league updated." : "League saved. It will be ready on the League step next time.");
            return true;
        } catch (caught) {
            setLeagueSaveState(caught instanceof Error ? caught.message : "This league could not be saved.");
            return false;
        }
    };
    const savePromptLogos = async ()=>{
        if (!logoSavePrompt || !signedIn) return;
        setLogoSaveBusy(true);
        setLogoSaveError(null);
        const saved = await saveLeaguePreset(logoSavePrompt.presetId);
        setLogoSaveBusy(false);
        if (!saved) {
            setLogoSaveError("The logos could not be saved yet. Your wizard entries are still here.");
            return;
        }
        const nextStep = logoSavePrompt.nextStep;
        setLogoSavePrompt(null);
        advanceToStep(nextStep);
    };
    const skipPromptLogoSave = ()=>{
        if (!logoSavePrompt) return;
        dismissedLogoFingerprint.current = logoSavePrompt.fingerprint;
        const nextStep = logoSavePrompt.nextStep;
        setLogoSavePrompt(null);
        advanceToStep(nextStep);
    };
    const applyImport = (preview)=>{
        const importedDivisionNames = Array.from(new Set(preview.teams.map((team)=>team.division?.replace(/\s+division$/i, "").trim()).filter((name)=>Boolean(name))));
        const divisionCount = importedDivisionNames.length === 4 ? 4 : importedDivisionNames.length === 3 ? 3 : 2;
        const divisions = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$defaults$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createDivisions"])(divisionCount).map((division, index)=>({
                ...division,
                name: importedDivisionNames[index] || division.name
            }));
        const divisionByName = new Map(divisions.map((division)=>[
                division.name.toLowerCase(),
                division.id
            ]));
        const teams = preview.teams.map((team, index)=>{
            const name = team.name.trim() || `Team ${index + 1}`;
            return {
                id: `team-${index + 1}`,
                providerId: team.providerId,
                city: team.city?.trim() || "",
                name,
                shortName: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$teamIdentity$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["teamMonogram"])(team.city || "", name),
                manager: team.manager?.trim() || `Manager ${index + 1}`,
                color: team.color || (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$defaults$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createTeams"])(preview.teams.length, divisions)[index].color,
                logoUrl: team.logoUrl,
                divisionId: team.division ? divisionByName.get(team.division.trim().toLowerCase()) || divisions[index % divisionCount].id : divisions[index % divisionCount].id,
                overallRank: team.rank || index + 1,
                stadium: team.stadium?.trim() || `${name} Stadium`
            };
        });
        setSetup((current)=>{
            const leagueName = preview.leagueName?.trim() || current.name;
            return {
                ...current,
                name: leagueName,
                abbreviation: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["leagueAcronym"])(leagueName),
                initials: undefined,
                color: preview.leagueColor || current.color,
                logoUrl: preview.leagueLogoUrl || current.logoUrl,
                seasonYear: preview.seasonYear || current.seasonYear,
                divisions,
                teams,
                platformConnection: preview.provider === "espn" || preview.provider === "sleeper" ? {
                    provider: preview.provider,
                    providerLeagueId: preview.providerLeagueId || "",
                    providerLeagueName: leagueName,
                    seasonYear: preview.seasonYear || current.seasonYear,
                    syncMode: preview.syncMode || "manual",
                    authType: preview.authType || "public",
                    status: "idle",
                    warnings: preview.warnings,
                    availableHistoryYears: preview.dataFound?.availableHistoryYears,
                    blockedHistoryYears: preview.dataFound?.blockedHistoryYears,
                    hasDraftData: preview.dataFound?.hasDraftData,
                    hasRosterData: preview.dataFound?.hasRosterData,
                    hasPlayerData: preview.dataFound?.hasPlayerData,
                    hasScoreSync: preview.dataFound?.hasScoreSync
                } : undefined,
                priorSeason: {
                    ...current.priorSeason,
                    enabled: Boolean(preview.hasPriorSeasonRanks),
                    hasData: Boolean(preview.hasPriorSeasonRanks),
                    entryMode: preview.hasPriorSeasonRanks ? "history" : "none"
                }
            };
        });
        setImportSource(null);
        setActiveSavedLeagueId(null);
        dismissedLogoFingerprint.current = null;
        setStep(1);
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };
    const runGenerate = ()=>{
        if (generating) return;
        setGuestGenerateWarning(false);
        setGenerating(true);
        setError(null);
        window.setTimeout(()=>{
            try {
                const season = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$schedule$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateLeagueSchedule"])(setup);
                // Give every guest schedule its own device-local id so a new season never
                // overwrites an earlier one. Signing in later claims it into the account.
                const localSeason = {
                    ...season,
                    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createLocalSeasonId"])()
                };
                (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["saveSeason"])(localSeason);
                // Keep `generating` true so the button stays locked; the reveal overlay
                // now owns the transition and routes to the workspace when it finishes.
                setRevealSeason(localSeason);
            } catch (caught) {
                setError(caught instanceof Error ? caught.message : "We couldn’t build this schedule yet.");
                setGenerating(false);
            }
        }, 80);
    };
    const generate = ()=>{
        if (generating) return;
        const missingCore = !setup.name.trim() || setup.teams.length < 8 || setup.teams.some((team)=>!team.name.trim());
        if (missingCore) {
            setError("Return to League and Teams to complete every required name before generating.");
            return;
        }
        const counts = setup.divisions.map((division)=>setup.teams.filter((team)=>team.divisionId === division.id).length);
        if (Math.max(...counts) - Math.min(...counts) > 1) {
            setError(`Return to Divisions and rebalance the team counts: ${counts.join(", ")}.`);
            return;
        }
        // Signed-in commissioner who built a league we haven't saved yet: offer to
        // keep it so next season is two clicks. Only for brand-new leagues, and only
        // once, so this never nags on a repeat generate or an already-saved league.
        if (signedIn && !savePromptResolved.current && !matchingSavedLeague()) {
            setSaveLeaguePrompt(true);
            return;
        }
        // Suggest (never force) an account once a guest has schedules living only on
        // this device — a new one is safe, but signing in keeps them all.
        if (!signedIn && (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["listLocalSeasons"])().some((season)=>season.id.startsWith("local-"))) {
            setGuestGenerateWarning(true);
            return;
        }
        runGenerate();
    };
    const dismissSavePrompt = ()=>{
        savePromptResolved.current = true;
        setSaveLeaguePrompt(false);
        runGenerate();
    };
    const acceptSavePrompt = async ()=>{
        if (saveLeaguePromptBusy) return;
        savePromptResolved.current = true;
        setSaveLeaguePromptBusy(true);
        await saveLeaguePreset();
        setSaveLeaguePromptBusy(false);
        setSaveLeaguePrompt(false);
        runGenerate();
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "builder-section",
        "aria-label": "League schedule builder",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "page-width builder-heading-row",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "eyebrow",
                            children: "Fantasy football schedule maker"
                        }, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                            lineNumber: 1086,
                            columnNumber: 14
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            children: "Build the season your league deserves."
                        }, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                            lineNumber: 1086,
                            columnNumber: 72
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                    lineNumber: 1086,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 1085,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "page-width wizard-progress",
                "aria-label": "Setup progress",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "wizard-progress-summary",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                        children: [
                                            "Step ",
                                            step + 1,
                                            " of ",
                                            STEPS.length
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 1090,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: STEPS[step].label
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 1090,
                                        columnNumber: 65
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 1090,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("em", {
                                children: [
                                    Math.round((step + 1) / STEPS.length * 100),
                                    "% complete"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 1091,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                "aria-hidden": "true",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {
                                    style: {
                                        width: `${(step + 1) / STEPS.length * 100}%`
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                    lineNumber: 1092,
                                    columnNumber: 35
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 1092,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 1089,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                        className: "wizard-progress-track",
                        ref: progressTrackRef,
                        style: {
                            "--wizard-progress-ratio": step / (STEPS.length - 1),
                            "--wizard-steps": STEPS.length
                        },
                        children: STEPS.map((item, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    title: item.label,
                                    "aria-current": index === step ? "step" : undefined,
                                    "aria-label": `Step ${index + 1}: ${item.label}${index < step ? ", complete" : index === step ? ", current" : ", upcoming"}`,
                                    disabled: index > step,
                                    className: index === step ? "active" : index < step ? "complete" : "",
                                    onClick: ()=>{
                                        setError(null);
                                        setStep(index);
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: index < step ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {}, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                lineNumber: 1095,
                                                columnNumber: 445
                                            }, this) : index + 1
                                        }, void 0, false, {
                                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                            lineNumber: 1095,
                                            columnNumber: 423
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("em", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                                    children: item.label
                                                }, void 0, false, {
                                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                    lineNumber: 1095,
                                                    columnNumber: 478
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                    children: item.shortLabel
                                                }, void 0, false, {
                                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                                    lineNumber: 1095,
                                                    columnNumber: 497
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                            lineNumber: 1095,
                                            columnNumber: 474
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                    lineNumber: 1095,
                                    columnNumber: 60
                                }, this)
                            }, item.label, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 1095,
                                columnNumber: 39
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 1094,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 1088,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "page-width builder-layout",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "builder-tool",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "sr-only",
                                "aria-live": "polite",
                                children: [
                                    "Step ",
                                    step + 1,
                                    " of ",
                                    STEPS.length,
                                    ": ",
                                    STEPS[step].label
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 1100,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "builder-content",
                                ref: builderContentRef,
                                tabIndex: -1,
                                children: [
                                    step === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SourceStep, {
                                        onManual: ()=>advanceToStep(1),
                                        onImport: (source)=>setImportSource(source)
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 1102,
                                        columnNumber: 28
                                    }, this),
                                    step === 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(LeagueStep, {
                                        setup: setup,
                                        setSetup: setSetup,
                                        presets: savedLeagues,
                                        loadedPreset: loadedPreset,
                                        onQuickImport: quickImportSavedLeague,
                                        onStartFresh: startNewLeague,
                                        onLeagueLogoUploaded: suggestAvatarFromLogo
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 1103,
                                        columnNumber: 28
                                    }, this),
                                    step === 2 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(TeamsStep, {
                                        setup: setup,
                                        setSetup: setSetup,
                                        showErrors: showFieldErrors
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 1104,
                                        columnNumber: 28
                                    }, this),
                                    step === 3 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(DivisionsStep, {
                                        setup: setup,
                                        setSetup: setSetup,
                                        showErrors: showFieldErrors
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 1105,
                                        columnNumber: 28
                                    }, this),
                                    step === 4 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SeasonStep, {
                                        setup: setup,
                                        setSetup: setSetup
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 1106,
                                        columnNumber: 28
                                    }, this),
                                    step === 5 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SeedingStep, {
                                        setup: setup,
                                        setSetup: setSetup
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 1107,
                                        columnNumber: 28
                                    }, this),
                                    step === 6 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(OpeningWeekStep, {
                                        setup: setup,
                                        setSetup: setSetup
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 1108,
                                        columnNumber: 28
                                    }, this),
                                    step === 7 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FairnessStep, {
                                        setup: setup,
                                        setSetup: setSetup
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 1109,
                                        columnNumber: 28
                                    }, this),
                                    step === 8 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(PlayoffsStep, {
                                        setup: setup,
                                        setSetup: setSetup
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 1110,
                                        columnNumber: 28
                                    }, this),
                                    step === 9 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ReviewStep, {
                                        setup: setup
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 1111,
                                        columnNumber: 28
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 1101,
                                columnNumber: 11
                            }, this),
                            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "builder-error",
                                role: "alert",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CircleAlert$3e$__["CircleAlert"], {}, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                        lineNumber: 1113,
                                        columnNumber: 65
                                    }, this),
                                    error
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 1113,
                                columnNumber: 21
                            }, this),
                            step > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "builder-actions",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(BuilderActionButtons, {
                                    step: step,
                                    generating: generating,
                                    skipDraftRankForNow: skipDraftRankForNow,
                                    back: back,
                                    next: next,
                                    generate: generate
                                }, void 0, false, {
                                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                    lineNumber: 1115,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 1114,
                                columnNumber: 24
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 1099,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(LivePreview, {
                        setup: setup,
                        step: step
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 1118,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 1098,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(BuilderBlueprintBar, {
                setup: setup,
                step: step,
                open: blueprintOpen,
                onToggle: ()=>setBlueprintOpen((current)=>!current),
                actions: {
                    step,
                    generating,
                    skipDraftRankForNow,
                    back,
                    next,
                    generate
                }
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 1120,
                columnNumber: 7
            }, this),
            importSource && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$imports$2f$ImportLeagueModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ImportLeagueModal"], {
                source: importSource,
                setup: setup,
                onClose: ()=>setImportSource(null),
                onConfirm: applyImport
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 1121,
                columnNumber: 24
            }, this),
            connectedSavedLeaguePrompt && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$Modal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ConfirmDialog"], {
                markClassName: "provider-app-icon",
                mark: connectedSavedLeaguePrompt.data.platformConnection?.provider === "espn" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                    src: "/providers/espn.png",
                    alt: ""
                }, void 0, false, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                    lineNumber: 1124,
                    columnNumber: 89
                }, void 0) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                    src: "/providers/sleeper.png",
                    alt: ""
                }, void 0, false, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                    lineNumber: 1124,
                    columnNumber: 132
                }, void 0),
                kicker: connectedLabel(connectedSavedLeaguePrompt)?.toUpperCase(),
                title: "Use connected league data?",
                labelId: "connected-saved-league-title",
                descriptionId: "connected-saved-league-description",
                closeLabel: "Close connected saved league choice",
                onClose: ()=>setConnectedSavedLeaguePrompt(null),
                actions: [
                    {
                        label: "Roster only",
                        onClick: ()=>applySavedLeaguePreset(connectedSavedLeaguePrompt, false),
                        variant: "secondary",
                        autoFocus: true
                    },
                    {
                        label: "Use saved connection",
                        onClick: ()=>applySavedLeaguePreset(connectedSavedLeaguePrompt, true),
                        variant: "primary",
                        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"], {}, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                            lineNumber: 1133,
                            columnNumber: 143
                        }, void 0)
                    }
                ],
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: connectedSavedLeaguePrompt.name
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 1136,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        id: "connected-saved-league-description",
                        children: [
                            "This saved league includes ",
                            connectedSavedLeaguePrompt.data.platformConnection?.provider === "espn" ? "ESPN" : "Sleeper",
                            " League ",
                            connectedSavedLeaguePrompt.data.platformConnection?.providerLeagueId,
                            ". You can keep that connection for score refresh later, or load only the teams and divisions."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 1137,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                        children: "LeagueWeaver still generates the schedule here. It will not update ESPN or Sleeper for you."
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 1138,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 1122,
                columnNumber: 38
            }, this),
            logoSavePrompt && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$Modal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ConfirmDialog"], {
                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$image$2d$plus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ImagePlus$3e$__["ImagePlus"], {}, void 0, false, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                    lineNumber: 1141,
                    columnNumber: 15
                }, void 0),
                kicker: logoSavePrompt.presetId ? "NEW LOGOS FOUND" : "KEEP YOUR NEW LOGOS",
                title: logoSavePrompt.presetId ? `Update ${logoSavePrompt.presetName}?` : "Save these with your league?",
                labelId: "league-logo-save-title",
                descriptionId: "league-logo-save-description",
                closeLabel: "Close logo save recommendation",
                busy: logoSaveBusy,
                onClose: ()=>setLogoSavePrompt(null),
                actions: [
                    {
                        label: "Not now",
                        onClick: skipPromptLogoSave,
                        variant: "secondary",
                        autoFocus: true
                    },
                    signedIn ? {
                        label: logoSaveBusy ? "Saving…" : logoSavePrompt.presetId ? "Update saved league" : "Save league and logos",
                        onClick: ()=>void savePromptLogos(),
                        variant: "primary",
                        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bookmark$2d$plus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__BookmarkPlus$3e$__["BookmarkPlus"], {}, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                            lineNumber: 1152,
                            columnNumber: 191
                        }, void 0)
                    } : {
                        label: "Sign in to save",
                        onClick: ()=>openSignIn(),
                        variant: "primary",
                        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$in$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LogIn$3e$__["LogIn"], {}, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                            lineNumber: 1153,
                            columnNumber: 98
                        }, void 0)
                    }
                ],
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: [
                            logoSavePrompt.changedCount,
                            " new or changed ",
                            logoSavePrompt.changedCount === 1 ? "image" : "images"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 1156,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        id: "league-logo-save-description",
                        children: logoSavePrompt.presetId ? "Save the new league, division, team, and playoff logos to this saved league so they are ready next season." : "Save this league setup with its logos so you will not need to upload them again."
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 1157,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                        children: "This includes the main playoff logo plus any round-specific and game-specific playoff logos."
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 1158,
                        columnNumber: 9
                    }, this),
                    logoSaveError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "league-logo-save-error",
                        role: "alert",
                        children: logoSaveError
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 1159,
                        columnNumber: 27
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 1140,
                columnNumber: 26
            }, this),
            guestGenerateWarning && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$Modal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ConfirmDialog"], {
                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldCheck$3e$__["ShieldCheck"], {}, void 0, false, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                    lineNumber: 1162,
                    columnNumber: 15
                }, void 0),
                kicker: "KEEP YOUR SCHEDULES SAFE",
                title: "Save your schedules to an account?",
                labelId: "guest-generate-title",
                descriptionId: "guest-generate-description",
                closeLabel: "Close save reminder",
                onClose: ()=>setGuestGenerateWarning(false),
                actions: [
                    {
                        label: "Continue as guest",
                        onClick: runGenerate,
                        variant: "secondary",
                        autoFocus: true
                    },
                    {
                        label: "Create free account",
                        onClick: ()=>{
                            setGuestGenerateWarning(false);
                            openSignIn("signup");
                        },
                        variant: "primary",
                        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$in$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LogIn$3e$__["LogIn"], {}, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                            lineNumber: 1171,
                            columnNumber: 143
                        }, void 0)
                    }
                ],
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    id: "guest-generate-description",
                    children: "Your schedules are saved on this device only. Create a free account and they will be safe — plus you can open them on any device. You can keep going as a guest; nothing you have already made will be deleted."
                }, void 0, false, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                    lineNumber: 1174,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 1161,
                columnNumber: 32
            }, this),
            saveLeaguePrompt && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$Modal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ConfirmDialog"], {
                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bookmark$2d$plus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__BookmarkPlus$3e$__["BookmarkPlus"], {}, void 0, false, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                    lineNumber: 1177,
                    columnNumber: 15
                }, void 0),
                kicker: "BEFORE YOU GO",
                title: "Save this league for next season?",
                labelId: "save-league-title",
                descriptionId: "save-league-description",
                closeLabel: "Close save reminder",
                busy: saveLeaguePromptBusy,
                onClose: dismissSavePrompt,
                actions: [
                    {
                        label: "Not now",
                        onClick: dismissSavePrompt,
                        variant: "secondary",
                        autoFocus: true
                    },
                    {
                        label: saveLeaguePromptBusy ? "Saving…" : "Save league",
                        onClick: ()=>void acceptSavePrompt(),
                        variant: "primary",
                        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bookmark$2d$plus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__BookmarkPlus$3e$__["BookmarkPlus"], {}, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                            lineNumber: 1187,
                            columnNumber: 136
                        }, void 0)
                    }
                ],
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    id: "save-league-description",
                    children: "We’ll remember your teams, divisions, colors, and logos — so next year you skip straight to Season. You can edit or delete it any time from your account."
                }, void 0, false, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                    lineNumber: 1190,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 1176,
                columnNumber: 28
            }, this),
            revealSeason && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$builder$2f$GenerationReveal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GenerationReveal"], {
                schedule: revealSeason,
                onComplete: ()=>router.push(`/season/${revealSeason.id}`)
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 1192,
                columnNumber: 24
            }, this),
            avatarNudge && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "avatar-nudge",
                role: "status",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "avatar-nudge-thumb",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                            src: avatarNudge,
                            alt: ""
                        }, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                            lineNumber: 1194,
                            columnNumber: 46
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 1194,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "avatar-nudge-copy",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: avatarNudgeState === "saved" ? "Set as your profile image" : "Use this as your profile image?"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 1196,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                children: avatarNudgeState === "saved" ? "Your league logo now shows on your commissioner account." : "Show your league logo as your commissioner avatar."
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 1197,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 1195,
                        columnNumber: 9
                    }, this),
                    avatarNudgeState !== "saved" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "avatar-nudge-actions",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "button-secondary",
                                onClick: dismissAvatarNudge,
                                children: "Not now"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 1200,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "button-primary",
                                disabled: avatarNudgeState === "saving",
                                onClick: ()=>void acceptAvatarNudge(),
                                children: avatarNudgeState === "saving" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "spinner"
                                        }, void 0, false, {
                                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                            lineNumber: 1201,
                                            columnNumber: 177
                                        }, this),
                                        "Saving…"
                                    ]
                                }, void 0, true) : "Use photo"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                                lineNumber: 1201,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 1199,
                        columnNumber: 42
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "avatar-nudge-close",
                        "aria-label": "Dismiss suggestion",
                        onClick: dismissAvatarNudge,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {}, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                            lineNumber: 1203,
                            columnNumber: 123
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                        lineNumber: 1203,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
                lineNumber: 1193,
                columnNumber: 23
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/builder/LeagueBuilder.tsx",
        lineNumber: 1084,
        columnNumber: 5
    }, this);
}
}),
"[project]/.claude/worktrees/playoff-suite/components/WelcomeGate.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WelcomeGate",
    ()=>WelcomeGate
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$welcome$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/welcome.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/storage.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
function WelcomeGate() {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$welcome$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["hasBeenWelcomed"])()) return;
        const importing = new URLSearchParams(window.location.search).has("import");
        if (importing || (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["loadSetup"])()) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$welcome$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["markWelcomed"])();
            return;
        }
        router.replace("/welcome");
    }, [
        router
    ]);
    return null;
}
}),
"[project]/.claude/worktrees/playoff-suite/components/ads/AdUnit.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AdUnit",
    ()=>AdUnit
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
const CLIENT_ID = ("TURBOPACK compile-time value", "ca-pub-3436602586436667");
// Per-placement slot ids. NEXT_PUBLIC_* vars must be read as literal member
// access so Next can inline them at build time — no dynamic indexing.
const SLOT_BY_PLACEMENT = {
    home: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME,
    workspace: process.env.NEXT_PUBLIC_ADSENSE_SLOT_WORKSPACE,
    public: process.env.NEXT_PUBLIC_ADSENSE_SLOT_PUBLIC
};
function AdUnit({ placement }) {
    const slot = SLOT_BY_PLACEMENT[placement];
    const configured = Boolean(CLIENT_ID && slot);
    const pushed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!configured || pushed.current) return;
        pushed.current = true;
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch  {
        // AdSense script not ready or blocked — leave the slot empty.
        }
    }, [
        configured
    ]);
    if (!configured) {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
            className: `ad-wrap ad-wrap-${placement}`,
            "aria-label": "Advertisement placeholder",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "ad-unit",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "ADVERTISEMENT"
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/ads/AdUnit.tsx",
                        lineNumber: 52,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: [
                            "AdSense slot “",
                            placement,
                            "” — set the env vars to go live."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/ads/AdUnit.tsx",
                        lineNumber: 53,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/ads/AdUnit.tsx",
                lineNumber: 51,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/.claude/worktrees/playoff-suite/components/ads/AdUnit.tsx",
            lineNumber: 50,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
        className: `ad-wrap ad-wrap-${placement}`,
        "aria-label": "Advertisement",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ins", {
            className: "adsbygoogle ad-slot",
            style: {
                display: "block"
            },
            "data-ad-client": CLIENT_ID,
            "data-ad-slot": slot,
            "data-ad-format": "auto",
            "data-full-width-responsive": "true"
        }, void 0, false, {
            fileName: "[project]/.claude/worktrees/playoff-suite/components/ads/AdUnit.tsx",
            lineNumber: 61,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/ads/AdUnit.tsx",
        lineNumber: 60,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=_claude_worktrees_playoff-suite_components_74d8726b._.js.map