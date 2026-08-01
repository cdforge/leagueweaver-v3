(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/.claude/worktrees/playoff-suite/components/account/AccountIdentity.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AccountIdentity",
    ()=>AccountIdentity
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$user$2d$round$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CircleUserRound$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-user-round.mjs [app-client] (ecmascript) <export default as CircleUserRound>");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/supabase/client.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$account$2f$AuthModalProvider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/components/account/AuthModalProvider.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
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
    _s();
    const [resolved, setResolved] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(identity ?? {
        signedIn: false
    });
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(identity === undefined);
    const { openSignIn } = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$account$2f$AuthModalProvider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuthModal"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AccountIdentity.useEffect": ()=>{
            if (identity !== undefined) {
                setResolved(identity);
                setLoading(false);
                return;
            }
            const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createClient"])();
            if (!supabase) {
                setLoading(false);
                return;
            }
            let active = true;
            supabase.auth.getUser().then({
                "AccountIdentity.useEffect": ({ data })=>{
                    if (active) {
                        setResolved(identityFromUser(data.user));
                        setLoading(false);
                    }
                }
            }["AccountIdentity.useEffect"]);
            const { data: listener } = supabase.auth.onAuthStateChange({
                "AccountIdentity.useEffect": (_event, session)=>{
                    if (active) {
                        setResolved(identityFromUser(session?.user ?? null));
                        setLoading(false);
                    }
                }
            }["AccountIdentity.useEffect"]);
            return ({
                "AccountIdentity.useEffect": ()=>{
                    active = false;
                    listener.subscription.unsubscribe();
                }
            })["AccountIdentity.useEffect"];
        }
    }["AccountIdentity.useEffect"], [
        identity
    ]);
    if (!resolved.signedIn) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        type: "button",
        onClick: ()=>openSignIn(),
        className: `account-link account-identity${loading ? " loading" : ""}`,
        "aria-label": "Sign in to League Weaver",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$user$2d$round$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CircleUserRound$3e$__["CircleUserRound"], {
                "aria-hidden": "true"
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/account/AccountIdentity.tsx",
                lineNumber: 78,
                columnNumber: 195
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        href: "/account",
        className: "account-link account-identity",
        "aria-label": `Open account for ${name}`,
        title: resolved.email,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: `account-avatar${resolved.avatarUrl ? " has-image" : ""}`,
                "aria-hidden": "true",
                children: resolved.avatarUrl ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "account-identity-copy",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: name
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/account/AccountIdentity.tsx",
                        lineNumber: 83,
                        columnNumber: 45
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
_s(AccountIdentity, "lYPtd7EqkvVbhzYtfDi3BAkZuVI=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$account$2f$AuthModalProvider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuthModal"]
    ];
});
_c = AccountIdentity;
var _c;
__turbopack_context__.k.register(_c, "AccountIdentity");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/.claude/worktrees/playoff-suite/components/AppHeader.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AppHeader",
    ()=>AppHeader,
    "BrandLockup",
    ()=>BrandLockup
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-right.mjs [app-client] (ecmascript) <export default as ArrowRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TriangleAlert$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.mjs [app-client] (ecmascript) <export default as TriangleAlert>");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$account$2f$AccountIdentity$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/components/account/AccountIdentity.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$Modal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/components/ui/Modal.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
function BrandLockup({ compact = false }) {
    _s();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [confirmOpen, setConfirmOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                className: "brand-lockup",
                href: "/welcome",
                "aria-label": "League Weaver home",
                onClick: handleClick,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
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
                    !compact && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: "LEAGUE WEAVER"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/AppHeader.tsx",
                                lineNumber: 34,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
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
            confirmOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$Modal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ConfirmDialog"], {
                tone: "gold",
                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TriangleAlert$3e$__["TriangleAlert"], {}, void 0, false, {
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
                        label: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                "Leave to welcome",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__["ArrowRight"], {}, void 0, false, {
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
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
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
_s(BrandLockup, "rtptwyNbNIf0BPHXJze70HOP/aI=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = BrandLockup;
function AppHeader() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        className: "topbar",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "page-width topbar-row",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(BrandLockup, {}, void 0, false, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/AppHeader.tsx",
                    lineNumber: 65,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                    className: "topnav",
                    "aria-label": "Primary navigation",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$account$2f$AccountIdentity$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AccountIdentity"], {}, void 0, false, {
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
_c1 = AppHeader;
var _c, _c1;
__turbopack_context__.k.register(_c, "BrandLockup");
__turbopack_context__.k.register(_c1, "AppHeader");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_claude_worktrees_playoff-suite_components_44876f7b._.js.map