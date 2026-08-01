module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

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
"[project]/.claude/worktrees/playoff-suite/components/ui/Modal.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ConfirmDialog",
    ()=>ConfirmDialog,
    "Modal",
    ()=>Modal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$dom$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-dom.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.mjs [app-ssr] (ecmascript) <export default as X>");
"use client";
;
;
;
;
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
// A single source of truth for modal layering so nested overlays (a discard
// confirm on top of the score sheet) only respond to Escape/Tab when they are
// the topmost surface. Populated in mount order; the last entry is the top.
const modalStack = [];
// Reference-counted scroll lock. Per-instance save/restore of body.overflow
// breaks when two modals unmount in the same React batch (the inner cleanup
// runs first and restores "hidden", leaving the page locked). Counting instead
// means only the first modal saves the original overflow and only the last one
// unmounting restores it — order-independent.
let scrollLockCount = 0;
let savedBodyOverflow = "";
function lockScroll() {
    if (scrollLockCount === 0) {
        savedBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
    }
    scrollLockCount += 1;
}
function unlockScroll() {
    scrollLockCount = Math.max(0, scrollLockCount - 1);
    if (scrollLockCount === 0) document.body.style.overflow = savedBodyOverflow;
}
function Modal({ onClose, children, className = "", backdropClassName = "", role = "dialog", labelledBy, describedBy, label, busy, closeOnBackdrop = true, closeOnEscape = true, initialFocusRef, dialogRef: externalDialogRef }) {
    const internalRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const dialogRef = externalDialogRef ?? internalRef;
    const id = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useId"])();
    // Keep the latest close handler without re-registering listeners on every
    // render, so a modal whose onClose closes over changing state stays correct.
    const onCloseRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(onClose);
    onCloseRef.current = onClose;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        modalStack.push(id);
        const isTop = ()=>modalStack[modalStack.length - 1] === id;
        const previouslyFocused = document.activeElement;
        lockScroll();
        const focusable = ()=>{
            const dialog = dialogRef.current;
            if (!dialog) return [];
            return Array.from(dialog.querySelectorAll(FOCUSABLE)).filter((el)=>el.offsetParent !== null);
        };
        const handleKey = (event)=>{
            if (!isTop()) return;
            if (event.key === "Escape" && closeOnEscape) {
                event.preventDefault();
                onCloseRef.current();
                return;
            }
            if (event.key !== "Tab") return;
            const items = focusable();
            if (!items.length) return;
            const first = items[0];
            const last = items[items.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        window.addEventListener("keydown", handleKey);
        // Defer initial focus a tick so children (and any autoFocus target) exist.
        const focusTimer = window.setTimeout(()=>{
            const target = initialFocusRef?.current ?? focusable()[0] ?? dialogRef.current;
            target?.focus();
        }, 0);
        return ()=>{
            window.removeEventListener("keydown", handleKey);
            window.clearTimeout(focusTimer);
            unlockScroll();
            const index = modalStack.lastIndexOf(id);
            if (index !== -1) modalStack.splice(index, 1);
            if (previouslyFocused && document.body.contains(previouslyFocused)) previouslyFocused.focus();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        id
    ]);
    if (typeof document === "undefined") return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$dom$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createPortal"])(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `modal-backdrop ${backdropClassName}`.trim(),
        role: "presentation",
        onMouseDown: (event)=>{
            if (closeOnBackdrop && event.target === event.currentTarget) onClose();
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
            ref: dialogRef,
            className: className,
            role: role,
            "aria-modal": "true",
            "aria-labelledby": labelledBy,
            "aria-describedby": describedBy,
            "aria-label": labelledBy ? undefined : label,
            "aria-busy": busy,
            tabIndex: -1,
            children: children
        }, void 0, false, {
            fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/Modal.tsx",
            lineNumber: 137,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/Modal.tsx",
        lineNumber: 132,
        columnNumber: 5
    }, this), document.body);
}
function ConfirmDialog({ title, kicker, icon, tone = "default", mark, markClassName = "", children, actions, onClose, closeLabel = "Close", labelId: providedLabelId, descriptionId, role = "dialog", backdropClassName = "", busy }) {
    const generatedId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useId"])();
    const labelId = providedLabelId ?? `${generatedId}-title`;
    const focusRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const hasAutoFocus = actions.some((action)=>action.autoFocus);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Modal, {
        onClose: onClose,
        className: `season-save-conflict tone-${tone}`,
        backdropClassName: `season-save-conflict-backdrop ${backdropClassName}`.trim(),
        role: role,
        labelledBy: labelId,
        describedBy: descriptionId,
        busy: busy,
        initialFocusRef: hasAutoFocus ? focusRef : undefined,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: `season-save-conflict-mark ${markClassName}`.trim(),
                        children: mark ?? icon
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/Modal.tsx",
                        lineNumber: 224,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: [
                            kicker && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                children: kicker
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/Modal.tsx",
                                lineNumber: 225,
                                columnNumber: 26
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                id: labelId,
                                children: title
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/Modal.tsx",
                                lineNumber: 225,
                                columnNumber: 50
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/Modal.tsx",
                        lineNumber: 225,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        "aria-label": closeLabel,
                        disabled: busy,
                        onClick: onClose,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {}, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/Modal.tsx",
                            lineNumber: 226,
                            columnNumber: 89
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/Modal.tsx",
                        lineNumber: 226,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/Modal.tsx",
                lineNumber: 223,
                columnNumber: 7
            }, this),
            children && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: children
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/Modal.tsx",
                lineNumber: 228,
                columnNumber: 20
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                children: actions.map((action, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        ref: action.autoFocus ? focusRef : undefined,
                        type: "button",
                        className: action.variant === "primary" ? "button-primary" : action.variant === "danger" ? "button-danger" : "button-secondary",
                        disabled: action.disabled || busy,
                        onClick: action.onClick,
                        children: [
                            action.icon,
                            action.label
                        ]
                    }, index, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/Modal.tsx",
                        lineNumber: 231,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/Modal.tsx",
                lineNumber: 229,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/Modal.tsx",
        lineNumber: 213,
        columnNumber: 5
    }, this);
}
}),
"[project]/.claude/worktrees/playoff-suite/components/ui/Tooltip.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Tooltip",
    ()=>Tooltip
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$dom$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-dom.js [app-ssr] (ecmascript)");
"use client";
;
;
;
function Tooltip({ label, children }) {
    const id = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useId"])();
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [position, setPosition] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        left: 0,
        top: 0,
        ready: false,
        below: false
    });
    const anchor = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const bubble = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLayoutEffect"])(()=>{
        if (!open) return;
        const update = ()=>{
            const anchorRect = anchor.current?.getBoundingClientRect();
            const bubbleRect = bubble.current?.getBoundingClientRect();
            if (!anchorRect || !bubbleRect) return;
            const gutter = 8;
            const below = anchorRect.top < bubbleRect.height + 16;
            const left = Math.min(Math.max(gutter + bubbleRect.width / 2, anchorRect.left + anchorRect.width / 2), window.innerWidth - gutter - bubbleRect.width / 2);
            const top = below ? anchorRect.bottom + 8 : anchorRect.top - bubbleRect.height - 8;
            setPosition({
                left,
                top,
                ready: true,
                below
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
        open
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        ref: anchor,
        className: "tooltip-wrap",
        "aria-describedby": open ? id : undefined,
        onMouseEnter: ()=>setOpen(true),
        onMouseLeave: ()=>setOpen(false),
        onFocus: ()=>setOpen(true),
        onBlur: ()=>setOpen(false),
        onKeyDown: (event)=>{
            if (event.key === "Escape" && open) setOpen(false);
        },
        children: [
            children,
            open && typeof document !== "undefined" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$dom$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createPortal"])(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                ref: bubble,
                id: id,
                className: `tooltip-bubble tooltip-bubble-portal ${position.below ? "below" : ""}`,
                role: "tooltip",
                style: {
                    left: position.left,
                    top: position.top,
                    visibility: position.ready ? "visible" : "hidden"
                },
                children: label
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/Tooltip.tsx",
                lineNumber: 38,
                columnNumber: 9
            }, this), document.body)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/ui/Tooltip.tsx",
        lineNumber: 35,
        columnNumber: 5
    }, this);
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/imageColors.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "analyzeIdentityImage",
    ()=>analyzeIdentityImage
]);
function componentToHex(value) {
    return Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0");
}
function toHex(red, green, blue) {
    return `#${componentToHex(red)}${componentToHex(green)}${componentToHex(blue)}`.toUpperCase();
}
function colorDistance(left, right) {
    return Math.sqrt((left[0] - right[0]) ** 2 + (left[1] - right[1]) ** 2 + (left[2] - right[2]) ** 2);
}
async function analyzeIdentityImage(file) {
    const source = await new Promise((resolve, reject)=>{
        const reader = new FileReader();
        reader.onload = ()=>resolve(String(reader.result));
        reader.onerror = ()=>reject(new Error("The image could not be read."));
        reader.readAsDataURL(file);
    });
    const image = await new Promise((resolve, reject)=>{
        const element = new Image();
        element.onload = ()=>resolve(element);
        element.onerror = ()=>reject(new Error("The image could not be loaded."));
        element.src = source;
    });
    const previewCanvas = document.createElement("canvas");
    const previewSize = 400;
    const scale = Math.min(1, previewSize / Math.max(image.naturalWidth, image.naturalHeight));
    previewCanvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    previewCanvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const previewContext = previewCanvas.getContext("2d");
    if (!previewContext) throw new Error("Image processing is unavailable.");
    previewContext.drawImage(image, 0, 0, previewCanvas.width, previewCanvas.height);
    const logoUrl = previewCanvas.toDataURL("image/webp", 0.88);
    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = 64;
    sampleCanvas.height = 64;
    const context = sampleCanvas.getContext("2d", {
        willReadFrequently: true
    });
    if (!context) throw new Error("Color analysis is unavailable.");
    context.drawImage(image, 0, 0, 64, 64);
    const pixels = context.getImageData(0, 0, 64, 64).data;
    const buckets = new Map();
    for(let index = 0; index < pixels.length; index += 16){
        const red = pixels[index];
        const green = pixels[index + 1];
        const blue = pixels[index + 2];
        const alpha = pixels[index + 3];
        if (alpha < 160) continue;
        const brightness = (red + green + blue) / 3;
        if (brightness > 244 || brightness < 18) continue;
        const qr = Math.round(red / 32) * 32;
        const qg = Math.round(green / 32) * 32;
        const qb = Math.round(blue / 32) * 32;
        const key = `${qr}-${qg}-${qb}`;
        const bucket = buckets.get(key) ?? {
            count: 0,
            red: 0,
            green: 0,
            blue: 0
        };
        bucket.count += 1;
        bucket.red += red;
        bucket.green += green;
        bucket.blue += blue;
        buckets.set(key, bucket);
    }
    const candidates = [
        ...buckets.values()
    ].sort((left, right)=>right.count - left.count).map((bucket)=>[
            Math.round(bucket.red / bucket.count),
            Math.round(bucket.green / bucket.count),
            Math.round(bucket.blue / bucket.count)
        ]);
    const distinct = [];
    for (const candidate of candidates){
        if (distinct.every((existing)=>colorDistance(existing, candidate) >= 72)) distinct.push(candidate);
        if (distinct.length === 5) break;
    }
    while(distinct.length < 5)distinct.push([
        17,
        122,
        69
    ]);
    return {
        logoUrl,
        colors: distinct.map(([red, green, blue])=>toHex(red, green, blue))
    };
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/matchups.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "calculateMatchupRating",
    ()=>calculateMatchupRating,
    "compareGamesByMatchupRating",
    ()=>compareGamesByMatchupRating,
    "formatGameDateTimeOverride",
    ()=>formatGameDateTimeOverride,
    "getGameOfWeekId",
    ()=>getGameOfWeekId,
    "getGameOfWeekSelection",
    ()=>getGameOfWeekSelection,
    "getMatchupRatingRange",
    ()=>getMatchupRatingRange,
    "getMatchupSignal",
    ()=>getMatchupSignal,
    "getWeeklyMatchupSignal",
    ()=>getWeeklyMatchupSignal,
    "matchupRating",
    ()=>matchupRating,
    "matchupSeriesLabel",
    ()=>matchupSeriesLabel,
    "normalizeScheduleMatchups",
    ()=>normalizeScheduleMatchups,
    "normalizeSeriesGameNumbers",
    ()=>normalizeSeriesGameNumbers,
    "orderWeekGamesByMatchupRating",
    ()=>orderWeekGamesByMatchupRating,
    "sortGamesForDisplay",
    ()=>sortGamesForDisplay
]);
function calculateMatchupRating(game, ranks) {
    const homeRank = ranks.get(game.homeTeamId) ?? 999;
    const awayRank = ranks.get(game.awayTeamId) ?? 999;
    return Math.round(((awayRank + homeRank) / 2 + 2.2 * Math.abs(awayRank - homeRank)) * 10) / 10;
}
function matchupRating(game, ranks) {
    return ranks ? calculateMatchupRating(game, ranks) : game.matchupRating ?? 999;
}
function getMatchupRatingRange(games, ranks) {
    const ratings = games.map((game)=>matchupRating(game, ranks)).filter(Number.isFinite);
    return ratings.length ? {
        min: Math.min(...ratings),
        max: Math.max(...ratings)
    } : {
        min: 0,
        max: 0
    };
}
function getMatchupSignal(game, ranks, range) {
    const rating = matchupRating(game, ranks);
    const resolvedRange = range ?? getMatchupRatingRange([
        game
    ], ranks);
    const span = resolvedRange.max - resolvedRange.min;
    const normalized = span > 0 ? Math.max(0, Math.min(1, (rating - resolvedRange.min) / span)) : 0.5;
    if (normalized <= 1 / 3) return {
        rating,
        normalized,
        bars: 3,
        label: "Competitive"
    };
    if (normalized <= 2 / 3) return {
        rating,
        normalized,
        bars: 2,
        label: "Neutral"
    };
    return {
        rating,
        normalized,
        bars: 1,
        label: "Lopsided"
    };
}
function getWeeklyMatchupSignal(rank, totalWeeks) {
    const total = Math.max(1, Math.round(totalWeeks));
    const safeRank = Math.max(1, Math.min(total, Math.round(rank)));
    const normalized = total > 1 ? (safeRank - 1) / (total - 1) : 0;
    if (normalized <= 1 / 3) return {
        rating: safeRank,
        normalized,
        bars: 3,
        label: "Competitive"
    };
    if (normalized <= 2 / 3) return {
        rating: safeRank,
        normalized,
        bars: 2,
        label: "Neutral"
    };
    return {
        rating: safeRank,
        normalized,
        bars: 1,
        label: "Lopsided"
    };
}
function matchupTypeOrder(game) {
    return game.matchupType === "division" ? 0 : 1;
}
function orderedRankPair(game, ranks) {
    const values = [
        ranks.get(game.homeTeamId) ?? 999,
        ranks.get(game.awayTeamId) ?? 999
    ];
    return values.sort((left, right)=>left - right);
}
function orderedTeamPair(game) {
    return [
        game.homeTeamId,
        game.awayTeamId
    ].sort((left, right)=>left.localeCompare(right));
}
function compareGamesByMatchupRating(left, right, ranks) {
    const ratingDifference = calculateMatchupRating(left, ranks) - calculateMatchupRating(right, ranks);
    if (ratingDifference) return ratingDifference;
    const typeDifference = matchupTypeOrder(left) - matchupTypeOrder(right);
    if (typeDifference) return typeDifference;
    const leftRanks = orderedRankPair(left, ranks);
    const rightRanks = orderedRankPair(right, ranks);
    const firstRankDifference = leftRanks[0] - rightRanks[0];
    if (firstRankDifference) return firstRankDifference;
    const secondRankDifference = leftRanks[1] - rightRanks[1];
    if (secondRankDifference) return secondRankDifference;
    const leftTeams = orderedTeamPair(left);
    const rightTeams = orderedTeamPair(right);
    return leftTeams[0].localeCompare(rightTeams[0]) || leftTeams[1].localeCompare(rightTeams[1]) || left.id.localeCompare(right.id);
}
function orderWeekGamesByMatchupRating(games, ranks) {
    return games.map((game)=>({
            ...game,
            matchupRating: calculateMatchupRating(game, ranks)
        })).sort((left, right)=>compareGamesByMatchupRating(left, right, ranks)).map((game, index)=>({
            ...game,
            gameNumber: index + 1
        }));
}
function normalizeScheduleMatchups(weeks, ranksForWeek) {
    const orderedWeeks = normalizeSeriesGameNumbers(weeks.map((week)=>({
            ...week,
            games: orderWeekGamesByMatchupRating(week.games, ranksForWeek(week.weekNumber))
        })));
    const metrics = orderedWeeks.map((week)=>{
        const ratings = week.games.map((game)=>game.matchupRating ?? 999);
        const bestMatchupRating = Math.min(...ratings);
        const averageMatchupRating = Math.round(ratings.reduce((sum, rating)=>sum + rating, 0) / Math.max(1, ratings.length) * 10) / 10;
        return {
            weekNumber: week.weekNumber,
            bestMatchupRating,
            averageMatchupRating
        };
    });
    const ranked = [
        ...metrics
    ].sort((left, right)=>left.bestMatchupRating - right.bestMatchupRating || left.averageMatchupRating - right.averageMatchupRating || left.weekNumber - right.weekNumber);
    const matchupRankByWeek = new Map(ranked.map((week, index)=>[
            week.weekNumber,
            index + 1
        ]));
    const metricsByWeek = new Map(metrics.map((week)=>[
            week.weekNumber,
            week
        ]));
    return orderedWeeks.map((week)=>({
            ...week,
            ...metricsByWeek.get(week.weekNumber),
            matchupRank: matchupRankByWeek.get(week.weekNumber)
        }));
}
function playoffImplicationScore(game, ranks, context) {
    const fieldSize = context.playoffFieldSize;
    if (fieldSize >= ranks.size) return 0;
    const hasClinchContext = Boolean(context.playoffBerthTeamIds || context.eliminatedTeamIds);
    if (hasClinchContext) {
        const unsettled = (teamId)=>!context.playoffBerthTeamIds?.has(teamId) && !context.eliminatedTeamIds?.has(teamId);
        if (!unsettled(game.homeTeamId) && !unsettled(game.awayTeamId)) return 0;
    }
    const homeRank = ranks.get(game.homeTeamId) ?? Number.POSITIVE_INFINITY;
    const awayRank = ranks.get(game.awayTeamId) ?? Number.POSITIVE_INFINITY;
    const cutline = fieldSize + 0.5;
    const proximity = (rank)=>Math.max(0, 3 - Math.abs(rank - cutline));
    const crossesCutline = homeRank <= fieldSize !== awayRank <= fieldSize;
    const nearCutline = Math.abs(homeRank - cutline) <= 1.5 && Math.abs(awayRank - cutline) <= 1.5;
    const bubbleCrossing = crossesCutline && Math.abs(homeRank - cutline) <= 2.5 && Math.abs(awayRank - cutline) <= 2.5;
    if (!nearCutline && !bubbleCrossing) return 0;
    return proximity(homeRank) + proximity(awayRank) + (crossesCutline ? 4 : 0);
}
function getGameOfWeekSelection(games, ranks, context) {
    if (!games.length) return undefined;
    const weightPlayoffImplications = context && context.weekNumber >= context.regularSeasonWeeks - 2;
    const candidates = games.map((game, index)=>{
        const rating = calculateMatchupRating(game, ranks);
        const implication = weightPlayoffImplications && context ? playoffImplicationScore(game, ranks, context) : 0;
        return {
            game,
            index,
            rating,
            implication
        };
    });
    const purePick = [
        ...candidates
    ].sort((left, right)=>left.rating - right.rating || compareGamesByMatchupRating(left.game, right.game, ranks) || left.index - right.index)[0];
    const selected = candidates.filter((candidate)=>candidate.rating === purePick.rating).sort((left, right)=>right.implication - left.implication || compareGamesByMatchupRating(left.game, right.game, ranks) || left.index - right.index)[0];
    return {
        gameId: selected.game.id,
        rating: selected.rating,
        adjustedRating: selected.rating,
        playoffImplication: selected.implication > 0 && selected.game.id !== purePick.game.id,
        pureGameId: purePick.game.id,
        pureRating: purePick.rating
    };
}
function getGameOfWeekId(games, ranks, context) {
    return getGameOfWeekSelection(games, ranks, context)?.gameId;
}
function sortGamesForDisplay(games, ranks) {
    const order = new Map(games.map((game, index)=>[
            game.id,
            index
        ]));
    return [
        ...games
    ].sort((left, right)=>{
        if (ranks) return compareGamesByMatchupRating(left, right, ranks);
        const ratingDifference = matchupRating(left) - matchupRating(right);
        return ratingDifference || (left.gameNumber ?? order.get(left.id) ?? 0) - (right.gameNumber ?? order.get(right.id) ?? 0);
    }).map((game, index)=>({
            ...game,
            gameNumber: index + 1
        }));
}
function matchupSeriesLabel(game) {
    const type = game.matchupType === "division" ? "Div" : "Cross-div";
    return `${type} · ${game.seriesGame} of ${game.seriesLength}`;
}
function normalizeSeriesGameNumbers(weeks) {
    const orderedGames = [
        ...weeks
    ].sort((left, right)=>left.weekNumber - right.weekNumber).flatMap((week)=>week.games);
    const pairKey = (game)=>[
            game.homeTeamId,
            game.awayTeamId
        ].sort().join("|");
    const totals = new Map();
    const occurrences = new Map();
    const numbering = new Map();
    for (const game of orderedGames){
        const key = pairKey(game);
        totals.set(key, (totals.get(key) ?? 0) + 1);
    }
    for (const game of orderedGames){
        const key = pairKey(game);
        const seriesGame = (occurrences.get(key) ?? 0) + 1;
        occurrences.set(key, seriesGame);
        numbering.set(game.id, {
            seriesGame,
            seriesLength: totals.get(key) ?? 1
        });
    }
    return weeks.map((week)=>({
            ...week,
            games: week.games.map((game)=>({
                    ...game,
                    ...numbering.get(game.id)
                }))
        }));
}
function formatGameDateTimeOverride(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/New_York",
        timeZoneName: "short"
    }).format(date);
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/monograms.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "divisionAcronym",
    ()=>divisionAcronym,
    "entityMonogram",
    ()=>entityMonogram,
    "leagueAcronym",
    ()=>leagueAcronym,
    "resolveInitials",
    ()=>resolveInitials
]);
const AUTO_MONOGRAM_BLOCKLIST = new Set([
    "ASS",
    "CUM",
    "CNT",
    "CUN",
    "DCK",
    "DIK",
    "FAG",
    "FCK",
    "FUC",
    "FUK",
    "KKK",
    "NIG",
    "NGR",
    "PNS",
    "SEX",
    "WTF"
]);
function words(value) {
    return value.trim().split(/\s+/).map((word)=>word.replace(/[^A-Za-z]/g, "")).filter(Boolean);
}
function safeCandidate(candidates, fallback) {
    for (const value of candidates){
        const candidate = value.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 3);
        if (candidate && !AUTO_MONOGRAM_BLOCKLIST.has(candidate)) return candidate;
    }
    return fallback;
}
function nameCandidates(name) {
    const nameWords = words(name);
    const kept = nameWords.map((word)=>`${word[0]}${word.slice(1).replace(/[AEIOUaeiou]/g, "")}`).join("");
    const letters = nameWords.join("");
    const candidates = kept.length >= 3 ? [
        kept,
        letters
    ] : [
        letters,
        kept
    ];
    return candidates;
}
function entityMonogram(name, city = "") {
    const cityWords = words(city);
    const nameWords = words(name);
    const candidates = [];
    if (cityWords.length >= 2) {
        const multiCity = `${cityWords[0][0]}${cityWords[1][0]}${nameWords[0]?.[0] ?? ""}`;
        if (multiCity.length >= 2) candidates.push(multiCity);
    } else if (cityWords.length === 1) {
        candidates.push(cityWords[0].slice(0, 3));
    }
    candidates.push(...nameCandidates(name));
    return safeCandidate(candidates, "TM");
}
function leagueAcronym(name) {
    const nameWords = words(name);
    const primary = nameWords.length > 1 ? nameWords.slice(0, 3).map((word)=>word[0]).join("") : nameWords[0]?.slice(0, 3) ?? "";
    return safeCandidate([
        primary,
        ...nameCandidates(name)
    ], "LW");
}
function divisionAcronym(name) {
    const nameWords = words(name);
    const primary = nameWords[0] ? `${nameWords[0][0]}FC` : "";
    return safeCandidate([
        primary,
        nameWords.join("").slice(0, 3)
    ], "DIV");
}
function resolveInitials(initials, automatic) {
    return initials?.trim() ? initials.trim().slice(0, 4) : automatic;
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/rankings.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "formatDraftPlace",
    ()=>formatDraftPlace,
    "getTeamsMissingDraftPlaces",
    ()=>getTeamsMissingDraftPlaces,
    "getWeekOneRankMap",
    ()=>getWeekOneRankMap,
    "getWeekOneTeamOrder",
    ()=>getWeekOneTeamOrder,
    "hasCompleteDraftRanking",
    ()=>hasCompleteDraftRanking
]);
function draftPlace(team) {
    return Number.isInteger(team.draftPlace) ? team.draftPlace : Number.POSITIVE_INFINITY;
}
function getWeekOneTeamOrder(setup) {
    if (setup.weekOne.rankingSource !== "draft-day") {
        return [
            ...setup.teams
        ].sort((left, right)=>left.overallRank - right.overallRank || left.id.localeCompare(right.id));
    }
    return [
        ...setup.teams
    ].sort((left, right)=>draftPlace(left) - draftPlace(right) || left.overallRank - right.overallRank || left.id.localeCompare(right.id));
}
function getWeekOneRankMap(setup) {
    return new Map(getWeekOneTeamOrder(setup).map((team, index)=>[
            team.id,
            index + 1
        ]));
}
function getTeamsMissingDraftPlaces(setup) {
    return setup.teams.filter((team)=>!Number.isInteger(team.draftPlace));
}
function hasCompleteDraftRanking(setup) {
    const places = setup.teams.map((team)=>team.draftPlace);
    return getTeamsMissingDraftPlaces(setup).length === 0 && new Set(places).size === setup.teams.length;
}
function formatDraftPlace(place, teamCount) {
    const remainder100 = place % 100;
    const suffix = remainder100 >= 11 && remainder100 <= 13 ? "th" : place % 10 === 1 ? "st" : place % 10 === 2 ? "nd" : place % 10 === 3 ? "rd" : "th";
    return `${place}${suffix} of ${teamCount}`;
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/tiebreakers.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_DIVISION_TIEBREAKERS",
    ()=>DEFAULT_DIVISION_TIEBREAKERS,
    "DEFAULT_LEAGUE_TIEBREAKERS",
    ()=>DEFAULT_LEAGUE_TIEBREAKERS,
    "DEFAULT_TIEBREAKERS",
    ()=>DEFAULT_TIEBREAKERS,
    "TIEBREAKER_RULES",
    ()=>TIEBREAKER_RULES,
    "TIEBREAKER_RULE_DESCRIPTIONS",
    ()=>TIEBREAKER_RULE_DESCRIPTIONS,
    "TIEBREAKER_RULE_LABELS",
    ()=>TIEBREAKER_RULE_LABELS,
    "normalizeTiebreakerSettings",
    ()=>normalizeTiebreakerSettings
]);
const TIEBREAKER_RULES = [
    "win-percentage",
    "division-percentage",
    "head-to-head",
    "points-scored",
    "common-opponents",
    "strength-of-victory",
    "strength-of-schedule",
    "point-differential"
];
const DEFAULT_TIEBREAKERS = [
    "win-percentage",
    "division-percentage",
    "head-to-head",
    "points-scored",
    "common-opponents",
    "strength-of-victory",
    "strength-of-schedule",
    "point-differential"
];
const DEFAULT_DIVISION_TIEBREAKERS = DEFAULT_TIEBREAKERS;
const DEFAULT_LEAGUE_TIEBREAKERS = DEFAULT_TIEBREAKERS;
const TIEBREAKER_RULE_LABELS = {
    "win-percentage": "Win percentage",
    "head-to-head": "Head-to-head",
    "division-percentage": "Division win percentage",
    "common-opponents": "Common opponents",
    "strength-of-victory": "Strength of victory",
    "strength-of-schedule": "Strength of schedule",
    "point-differential": "Point differential",
    "points-scored": "Points scored"
};
const TIEBREAKER_RULE_DESCRIPTIONS = {
    "win-percentage": "Overall record, with a tie counting as half a win.",
    "head-to-head": "Record only in games among the teams that are still tied.",
    "division-percentage": "Record in games against the team's own division.",
    "common-opponents": "Record against opponents every team in the tie has played.",
    "strength-of-victory": "Average win percentage of opponents this team defeated.",
    "strength-of-schedule": "Average win percentage of every opponent this team played.",
    "point-differential": "Points scored minus points allowed.",
    "points-scored": "Total points scored through the selected week."
};
function normalizeStack(value, fallback) {
    if (!Array.isArray(value)) return [
        ...fallback
    ];
    const seen = new Set();
    return value.filter((rule)=>{
        if (!TIEBREAKER_RULES.includes(rule) || seen.has(rule)) return false;
        seen.add(rule);
        return true;
    });
}
function normalizeTiebreakerSettings(value) {
    const manualOverrides = value?.manualOverrides && typeof value.manualOverrides === "object" ? Object.fromEntries(Object.entries(value.manualOverrides).filter(([signature, teamIds])=>signature.length > 0 && Array.isArray(teamIds) && teamIds.every((teamId)=>typeof teamId === "string"))) : {};
    const rules = normalizeStack(value?.league ?? value?.division, DEFAULT_TIEBREAKERS);
    return {
        division: [
            ...rules
        ],
        league: [
            ...rules
        ],
        manualOverrides
    };
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/standings.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "calculateDivisionStandings",
    ()=>calculateDivisionStandings,
    "calculateStandings",
    ()=>calculateStandings,
    "formatRecord",
    ()=>formatRecord,
    "freezeCompletedRankHistory",
    ()=>freezeCompletedRankHistory,
    "getEnteringWeekRankMap",
    ()=>getEnteringWeekRankMap,
    "getEnteringWeekRankSnapshot",
    ()=>getEnteringWeekRankSnapshot,
    "getLiveRankHistory",
    ()=>getLiveRankHistory,
    "getWeekRankSnapshot",
    ()=>getWeekRankSnapshot,
    "resolveStandings",
    ()=>resolveStandings,
    "tiebreakerContextSignature",
    ()=>tiebreakerContextSignature
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$rankings$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/rankings.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$tiebreakers$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/tiebreakers.ts [app-ssr] (ecmascript)");
;
;
function recordPercentage(wins, losses, ties) {
    const games = wins + losses + ties;
    return games ? (wins + ties * .5) / games : null;
}
function buildRawStandings(schedule, throughWeek) {
    const rows = new Map();
    const streaks = new Map();
    const completedGames = [];
    for (const team of schedule.setup.teams){
        rows.set(team.id, {
            teamId: team.id,
            wins: 0,
            losses: 0,
            ties: 0,
            pointsFor: 0,
            pointsAgainst: 0,
            winPercentage: 0,
            divisionWins: 0,
            divisionLosses: 0,
            divisionTies: 0,
            streak: "—"
        });
        streaks.set(team.id, []);
    }
    const teamById = new Map(schedule.setup.teams.map((team)=>[
            team.id,
            team
        ]));
    for (const week of schedule.weeks){
        if (week.weekNumber > throughWeek) continue;
        for (const game of week.games){
            if (game.homeScore == null || game.awayScore == null) continue;
            const home = rows.get(game.homeTeamId);
            const away = rows.get(game.awayTeamId);
            if (!home || !away) continue;
            completedGames.push({
                game,
                homeScore: game.homeScore,
                awayScore: game.awayScore
            });
            home.pointsFor += game.homeScore;
            home.pointsAgainst += game.awayScore;
            away.pointsFor += game.awayScore;
            away.pointsAgainst += game.homeScore;
            const sameDivision = teamById.get(game.homeTeamId)?.divisionId === teamById.get(game.awayTeamId)?.divisionId;
            if (game.homeScore === game.awayScore) {
                home.ties += 1;
                away.ties += 1;
                if (sameDivision) {
                    home.divisionTies += 1;
                    away.divisionTies += 1;
                }
                streaks.get(home.teamId)?.push("T");
                streaks.get(away.teamId)?.push("T");
            } else if (game.homeScore > game.awayScore) {
                home.wins += 1;
                away.losses += 1;
                if (sameDivision) {
                    home.divisionWins += 1;
                    away.divisionLosses += 1;
                }
                streaks.get(home.teamId)?.push("W");
                streaks.get(away.teamId)?.push("L");
            } else {
                away.wins += 1;
                home.losses += 1;
                if (sameDivision) {
                    away.divisionWins += 1;
                    home.divisionLosses += 1;
                }
                streaks.get(away.teamId)?.push("W");
                streaks.get(home.teamId)?.push("L");
            }
        }
    }
    for (const row of rows.values()){
        row.winPercentage = recordPercentage(row.wins, row.losses, row.ties) ?? 0;
        const history = streaks.get(row.teamId) ?? [];
        if (history.length) {
            const latest = history.at(-1);
            let count = 0;
            for(let index = history.length - 1; index >= 0 && history[index] === latest; index -= 1)count += 1;
            row.streak = `${latest}${count}`;
        }
    }
    return {
        rows,
        completedGames,
        teamById
    };
}
function opponentFor(game, teamId) {
    if (game.game.homeTeamId === teamId) return game.game.awayTeamId;
    if (game.game.awayTeamId === teamId) return game.game.homeTeamId;
    return undefined;
}
function recordAgainst(teamId, games, allowedOpponents) {
    let wins = 0;
    let losses = 0;
    let ties = 0;
    for (const completed of games){
        const opponentId = opponentFor(completed, teamId);
        if (!opponentId || !allowedOpponents.has(opponentId)) continue;
        const teamScore = completed.game.homeTeamId === teamId ? completed.homeScore : completed.awayScore;
        const opponentScore = completed.game.homeTeamId === teamId ? completed.awayScore : completed.homeScore;
        if (teamScore > opponentScore) wins += 1;
        else if (teamScore < opponentScore) losses += 1;
        else ties += 1;
    }
    return recordPercentage(wins, losses, ties);
}
function divisionSeedMap(schedule, preseasonRanks) {
    const result = new Map();
    for (const division of schedule.setup.divisions){
        schedule.setup.teams.filter((team)=>team.divisionId === division.id).sort((left, right)=>(preseasonRanks.get(left.id) ?? Infinity) - (preseasonRanks.get(right.id) ?? Infinity) || left.name.localeCompare(right.name)).forEach((team, index)=>result.set(team.id, index + 1));
    }
    return result;
}
function tiebreakerContextSignature(scope, teamIds, divisionId) {
    return `v1:${scope}:${divisionId || "all"}:${[
        ...teamIds
    ].sort().join(",")}`;
}
function resolveStandings(schedule, options = {}) {
    const throughWeek = options.throughWeek ?? Number.POSITIVE_INFINITY;
    const scope = options.scope ?? "league";
    const { rows: rowsById, completedGames, teamById } = buildRawStandings(schedule, throughWeek);
    const settings = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$tiebreakers$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizeTiebreakerSettings"])(schedule.setup.tiebreakers);
    const rules = settings[scope];
    const eligibleIds = options.teamIds ?? (scope === "division" && options.divisionId ? schedule.setup.teams.filter((team)=>team.divisionId === options.divisionId).map((team)=>team.id) : schedule.setup.teams.map((team)=>team.id));
    const eligibleRows = eligibleIds.map((teamId)=>rowsById.get(teamId)).filter((row)=>Boolean(row));
    const preseasonRanks = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$rankings$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getWeekOneRankMap"])(schedule.setup);
    const divisionSeeds = divisionSeedMap(schedule, preseasonRanks);
    const opponentWinPercentage = new Map([
        ...rowsById.values()
    ].map((row)=>[
            row.teamId,
            row.winPercentage
        ]));
    const opponentsByTeam = new Map(schedule.setup.teams.map((team)=>[
            team.id,
            new Set()
        ]));
    const defeatedOpponentsByTeam = new Map(schedule.setup.teams.map((team)=>[
            team.id,
            []
        ]));
    for (const completed of completedGames){
        opponentsByTeam.get(completed.game.homeTeamId)?.add(completed.game.awayTeamId);
        opponentsByTeam.get(completed.game.awayTeamId)?.add(completed.game.homeTeamId);
        if (completed.homeScore > completed.awayScore) defeatedOpponentsByTeam.get(completed.game.homeTeamId)?.push(completed.game.awayTeamId);
        else if (completed.awayScore > completed.homeScore) defeatedOpponentsByTeam.get(completed.game.awayTeamId)?.push(completed.game.homeTeamId);
    }
    const averageOpponentPercentage = (opponentIds)=>opponentIds.length ? opponentIds.reduce((total, opponentId)=>total + (opponentWinPercentage.get(opponentId) ?? 0), 0) / opponentIds.length : null;
    const strengthOfVictory = new Map(schedule.setup.teams.map((team)=>[
            team.id,
            averageOpponentPercentage(defeatedOpponentsByTeam.get(team.id) ?? [])
        ]));
    const strengthOfSchedule = new Map(schedule.setup.teams.map((team)=>{
        const opponentIds = completedGames.map((game)=>opponentFor(game, team.id)).filter((opponentId)=>Boolean(opponentId));
        return [
            team.id,
            averageOpponentPercentage(opponentIds)
        ];
    }));
    const explanations = new Map();
    const tieGroups = [];
    const contextualValues = (bucket, rule)=>{
        const tiedIds = new Set(bucket.map((row)=>row.teamId));
        let commonOpponents;
        if (rule === "common-opponents") {
            const opponentSets = bucket.map((row)=>opponentsByTeam.get(row.teamId) ?? new Set());
            commonOpponents = new Set(opponentSets[0] ?? []);
            for (const opponents of opponentSets.slice(1)){
                for (const opponentId of commonOpponents)if (!opponents.has(opponentId)) commonOpponents.delete(opponentId);
            }
        }
        return new Map(bucket.map((row)=>{
            if (rule === "win-percentage") return [
                row.teamId,
                row.winPercentage
            ];
            if (rule === "head-to-head") return [
                row.teamId,
                recordAgainst(row.teamId, completedGames, tiedIds)
            ];
            if (rule === "division-percentage") return [
                row.teamId,
                recordPercentage(row.divisionWins, row.divisionLosses, row.divisionTies)
            ];
            if (rule === "common-opponents") return [
                row.teamId,
                commonOpponents?.size ? recordAgainst(row.teamId, completedGames, commonOpponents) : null
            ];
            if (rule === "strength-of-victory") return [
                row.teamId,
                strengthOfVictory.get(row.teamId) ?? null
            ];
            if (rule === "strength-of-schedule") return [
                row.teamId,
                strengthOfSchedule.get(row.teamId) ?? null
            ];
            if (rule === "point-differential") return [
                row.teamId,
                row.pointsFor - row.pointsAgainst
            ];
            return [
                row.teamId,
                row.pointsFor
            ];
        }));
    };
    const fallback = (bucket, appliedRules)=>{
        const signature = tiebreakerContextSignature(scope, bucket.map((row)=>row.teamId), options.divisionId);
        const manualOrder = settings.manualOverrides[signature];
        const exactManualOrder = manualOrder?.length === bucket.length && [
            ...manualOrder
        ].sort().every((teamId, index)=>teamId === bucket.map((row)=>row.teamId).sort()[index]);
        const ordered = exactManualOrder ? manualOrder.map((teamId)=>rowsById.get(teamId)).filter(Boolean) : [
            ...bucket
        ].sort((left, right)=>(preseasonRanks.get(left.teamId) ?? Infinity) - (preseasonRanks.get(right.teamId) ?? Infinity) || (divisionSeeds.get(left.teamId) ?? Infinity) - (divisionSeeds.get(right.teamId) ?? Infinity) || teamById.get(left.teamId).name.localeCompare(teamById.get(right.teamId).name));
        const resolution = exactManualOrder ? "manual" : "fallback";
        const explanation = exactManualOrder ? "The commissioner’s saved order resolved this exact tie." : "All configured rules remained tied, so preseason seed, division seed, then team name set the order.";
        tieGroups.push({
            signature,
            scope,
            divisionId: options.divisionId,
            teamIds: bucket.map((row)=>row.teamId),
            orderedTeamIds: ordered.map((row)=>row.teamId),
            appliedRules,
            resolution,
            explanation
        });
        for (const row of ordered)explanations.set(row.teamId, {
            label: explanation,
            resolution
        });
        return ordered;
    };
    const rankBucket = (bucket, ruleIndex, appliedRules)=>{
        if (bucket.length <= 1) return bucket;
        if (ruleIndex >= rules.length) return fallback(bucket, appliedRules);
        const rule = rules[ruleIndex];
        const values = contextualValues(bucket, rule);
        const groups = new Map();
        for (const row of bucket){
            const value = values.get(row.teamId) ?? null;
            groups.set(value, [
                ...groups.get(value) ?? [],
                row
            ]);
        }
        const nextAppliedRules = [
            ...appliedRules,
            rule
        ];
        if (groups.size === 1) return rankBucket(bucket, ruleIndex + 1, nextAppliedRules);
        const orderedGroups = [
            ...groups.entries()
        ].sort(([left], [right])=>{
            if (left == null) return 1;
            if (right == null) return -1;
            return right - left;
        });
        for (const [value, rows] of orderedGroups){
            for (const row of rows)explanations.set(row.teamId, {
                rule,
                label: `${__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$tiebreakers$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TIEBREAKER_RULE_LABELS"][rule]} separated this tie.`,
                value: value ?? undefined,
                resolution: "rule"
            });
        }
        return orderedGroups.flatMap(([, rows])=>rankBucket(rows, ruleIndex + 1, nextAppliedRules));
    };
    const rows = rankBucket(eligibleRows, 0, []);
    return {
        rows,
        tieGroups,
        explanationsByTeam: Object.fromEntries(explanations)
    };
}
function calculateStandings(schedule, throughWeek = Number.POSITIVE_INFINITY) {
    return resolveStandings(schedule, {
        throughWeek,
        scope: "league"
    }).rows;
}
function calculateDivisionStandings(schedule, divisionId, throughWeek = Number.POSITIVE_INFINITY) {
    return resolveStandings(schedule, {
        throughWeek,
        scope: "division",
        divisionId
    }).rows;
}
function getEnteringWeekRankMap(schedule, weekNumber) {
    const snapshot = getEnteringWeekRankSnapshot(schedule, weekNumber);
    return new Map(snapshot.rows.map((row)=>[
            row.teamId,
            row.rank
        ]));
}
function getLiveRankHistory(schedule) {
    const preseasonRanks = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$rankings$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getWeekOneRankMap"])(schedule.setup);
    const savedSnapshots = new Map((schedule.rankHistory ?? []).map((snapshot)=>[
            snapshot.weekNumber,
            snapshot
        ]));
    let previousRanks = preseasonRanks;
    const snapshots = [];
    const buildSnapshot = (weekNumber, completed, playedGames)=>{
        const resolution = resolveStandings(schedule, {
            throughWeek: weekNumber,
            scope: "league"
        });
        const standings = resolution.rows;
        const currentRanks = new Map(standings.map((row, index)=>[
                row.teamId,
                index + 1
            ]));
        snapshots.push({
            weekNumber,
            completed,
            playedGames,
            rows: standings.map((row, index)=>{
                const rank = index + 1;
                const previousRank = previousRanks.get(row.teamId) ?? preseasonRanks.get(row.teamId) ?? rank;
                return {
                    ...row,
                    rank,
                    previousRank,
                    rankChange: previousRank - rank,
                    preseasonRank: preseasonRanks.get(row.teamId) ?? rank,
                    tiebreaker: resolution.explanationsByTeam[row.teamId]
                };
            })
        });
        previousRanks = currentRanks;
    };
    const preseasonSnapshot = savedSnapshots.get(0);
    if (preseasonSnapshot) {
        snapshots.push(preseasonSnapshot);
        previousRanks = new Map(preseasonSnapshot.rows.map((row)=>[
                row.teamId,
                row.rank
            ]));
    } else {
        buildSnapshot(0, true, 0);
    }
    for (const week of [
        ...schedule.weeks
    ].sort((left, right)=>left.weekNumber - right.weekNumber)){
        const savedSnapshot = savedSnapshots.get(week.weekNumber);
        if (savedSnapshot) {
            snapshots.push(savedSnapshot);
            previousRanks = new Map(savedSnapshot.rows.map((row)=>[
                    row.teamId,
                    row.rank
                ]));
            continue;
        }
        const playedGames = week.games.filter((game)=>game.homeScore != null && game.awayScore != null).length;
        buildSnapshot(week.weekNumber, week.games.length > 0 && playedGames === week.games.length, playedGames);
    }
    return snapshots;
}
function getEnteringWeekRankSnapshot(schedule, weekNumber) {
    const history = getLiveRankHistory(schedule);
    const enteringWeek = Math.max(0, weekNumber - 1);
    return history.find((snapshot)=>snapshot.weekNumber === enteringWeek) ?? history[0];
}
function getWeekRankSnapshot(schedule, weekNumber) {
    const history = getLiveRankHistory(schedule);
    const week = history.find((snapshot)=>snapshot.weekNumber === weekNumber);
    if (week && (week.completed || week.playedGames > 0)) return week;
    return history.find((snapshot)=>snapshot.weekNumber === Math.max(0, weekNumber - 1)) ?? history[0];
}
function freezeCompletedRankHistory(schedule) {
    const existingWeeks = new Set((schedule.rankHistory ?? []).map((snapshot)=>snapshot.weekNumber));
    const frozen = [];
    let priorWeekFrozen = true;
    for (const snapshot of getLiveRankHistory(schedule)){
        const shouldFreeze = snapshot.weekNumber === 0 || existingWeeks.has(snapshot.weekNumber) || priorWeekFrozen && snapshot.completed;
        if (shouldFreeze) frozen.push(snapshot);
        priorWeekFrozen = shouldFreeze;
    }
    return {
        ...schedule,
        rankHistory: frozen
    };
}
function formatRecord(row) {
    return row.ties ? `${row.wins}-${row.losses}-${row.ties}` : `${row.wins}-${row.losses}`;
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/playoffs.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PLAYOFF_THEME_COLORS",
    ()=>PLAYOFF_THEME_COLORS,
    "createDefaultPlayoffSettings",
    ()=>createDefaultPlayoffSettings,
    "getFirstRoundSeedPairs",
    ()=>getFirstRoundSeedPairs,
    "getMaximumPlayoffFieldSize",
    ()=>getMaximumPlayoffFieldSize,
    "getMaximumPlayoffWeeks",
    ()=>getMaximumPlayoffWeeks,
    "getPlayoffByeCount",
    ()=>getPlayoffByeCount,
    "getPlayoffGameBrandingSlots",
    ()=>getPlayoffGameBrandingSlots,
    "getPlayoffRoundNames",
    ()=>getPlayoffRoundNames,
    "getRequiredPlayoffWeeks",
    ()=>getRequiredPlayoffWeeks,
    "isPlayoffPlacementUsable",
    ()=>isPlayoffPlacementUsable,
    "nextPowerOfTwo",
    ()=>nextPowerOfTwo,
    "normalizePlayoffSettings",
    ()=>normalizePlayoffSettings,
    "playoffPlacementLabel",
    ()=>playoffPlacementLabel,
    "projectPlayoffRounds",
    ()=>projectPlayoffRounds,
    "projectPlayoffSeeds",
    ()=>projectPlayoffSeeds,
    "recommendedPlayoffFieldSize",
    ()=>recommendedPlayoffFieldSize,
    "resolvePlayoffPlacementMode",
    ()=>resolvePlayoffPlacementMode
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$standings$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/standings.ts [app-ssr] (ecmascript)");
;
const PLAYOFF_THEME_COLORS = {
    gold: "#E3B940",
    silver: "#68747B",
    bronze: "#9A5B2E"
};
function getMaximumPlayoffWeeks(regularSeasonWeeks) {
    return 17 - regularSeasonWeeks;
}
function getRequiredPlayoffWeeks(fieldSize, bracketType = "single-elimination") {
    const singleEliminationRounds = Math.max(1, Math.ceil(Math.log2(Math.max(2, fieldSize))));
    if (bracketType === "ladder") return Math.max(1, fieldSize - 1);
    return singleEliminationRounds;
}
function getMaximumPlayoffFieldSize(teamCount, regularSeasonWeeks, bracketType = "single-elimination") {
    let maximum = 2;
    for(let fieldSize = 2; fieldSize <= teamCount; fieldSize += 1){
        if (getRequiredPlayoffWeeks(fieldSize, bracketType) <= getMaximumPlayoffWeeks(regularSeasonWeeks)) maximum = fieldSize;
    }
    return Math.min(teamCount, maximum);
}
function recommendedPlayoffFieldSize(teamCount, regularSeasonWeeks = 14) {
    return Math.min(6, getMaximumPlayoffFieldSize(teamCount, regularSeasonWeeks));
}
function createDefaultPlayoffSettings(teamCount, _leagueColor = "#117A45", regularSeasonWeeks = 14) {
    return {
        fieldSize: recommendedPlayoffFieldSize(teamCount, regularSeasonWeeks),
        bracketType: "single-elimination",
        placementMode: "auto",
        reseedMode: "fixed",
        seedDisplayMode: "reranked",
        championshipVenueMode: "higher-seed",
        theme: "gold",
        fieldStatus: "live",
        lockedTeamIds: [],
        consolationMode: "standard",
        thirdPlaceGame: true,
        name: "Championship Playoffs",
        color: PLAYOFF_THEME_COLORS.gold
    };
}
function normalizePlayoffSettings(value, teamCount, leagueColor, regularSeasonWeeks = 14) {
    const defaults = createDefaultPlayoffSettings(teamCount, leagueColor, regularSeasonWeeks);
    if (!value) return defaults;
    let bracketType = value.bracketType === "ladder" ? "ladder" : "single-elimination";
    let maximumFieldSize = getMaximumPlayoffFieldSize(teamCount, regularSeasonWeeks, bracketType);
    if (maximumFieldSize < 2) {
        bracketType = "single-elimination";
        maximumFieldSize = getMaximumPlayoffFieldSize(teamCount, regularSeasonWeeks, bracketType);
    }
    const requestedFieldSize = Math.round(Number(value.fieldSize) || defaults.fieldSize);
    const fieldSize = Math.max(2, Math.min(maximumFieldSize, requestedFieldSize));
    const legacyReseedMode = value.reseed === true ? "each-round" : "fixed";
    const reseedMode = [
        "fixed",
        "each-round",
        "protected"
    ].includes(value.reseedMode || "") ? value.reseedMode : legacyReseedMode;
    const lockedTeamIds = Array.isArray(value.lockedTeamIds) ? value.lockedTeamIds.filter((teamId)=>typeof teamId === "string").slice(0, fieldSize) : [];
    const theme = [
        "gold",
        "silver",
        "bronze",
        "custom"
    ].includes(value.theme || "") ? value.theme : defaults.theme;
    const themedColor = theme === "custom" ? value.color || defaults.color : PLAYOFF_THEME_COLORS[theme];
    const consolationMode = [
        "off",
        "standard",
        "division-halves"
    ].includes(value.consolationMode || "") ? value.consolationMode : defaults.consolationMode;
    return {
        fieldSize,
        bracketType,
        placementMode: [
            "auto",
            "division-halves",
            "division-leaders",
            "overall"
        ].includes(value.placementMode || "") ? value.placementMode : defaults.placementMode,
        reseedMode,
        seedDisplayMode: value.seedDisplayMode === "standings-finish" ? "standings-finish" : "reranked",
        championshipVenueMode: value.championshipVenueMode === "neutral-site" || value.hostVenueMode === "neutral-site" ? "neutral-site" : "higher-seed",
        theme,
        fieldStatus: value.fieldStatus === "locked" && lockedTeamIds.length === fieldSize ? "locked" : "live",
        lockedTeamIds,
        consolationMode,
        thirdPlaceGame: consolationMode !== "off" && fieldSize >= 4,
        name: value.name?.trim() || defaults.name,
        color: themedColor,
        logoUrl: value.logoUrl || undefined,
        roundNames: Array.isArray(value.roundNames) ? value.roundNames.map((name)=>String(name).slice(0, 40)) : undefined,
        roundLogoUrls: Array.isArray(value.roundLogoUrls) ? value.roundLogoUrls.map((logoUrl)=>typeof logoUrl === "string" ? logoUrl : "") : undefined,
        gameNames: value.gameNames && typeof value.gameNames === "object" ? Object.fromEntries(Object.entries(value.gameNames).filter(([gameId, name])=>/^(main|consolation)-r\d+-g\d+$/.test(gameId) && typeof name === "string" && name.trim()).map(([gameId, name])=>[
                gameId,
                name.trim().slice(0, 60)
            ]).slice(0, 64)) : undefined,
        gameLogoUrls: value.gameLogoUrls && typeof value.gameLogoUrls === "object" ? Object.fromEntries(Object.entries(value.gameLogoUrls).filter(([gameId, logoUrl])=>/^(main|consolation)-r\d+-g\d+$/.test(gameId) && typeof logoUrl === "string" && logoUrl).slice(0, 64)) : undefined
    };
}
function nextPowerOfTwo(value) {
    let result = 1;
    while(result < Math.max(1, value))result *= 2;
    return result;
}
function getPlayoffByeCount(fieldSize) {
    return nextPowerOfTwo(fieldSize) - fieldSize;
}
function isPlayoffPlacementUsable(mode, divisionCount, fieldSize) {
    if (mode === "overall") return true;
    if (mode === "division-halves") return (divisionCount === 2 || divisionCount === 4) && fieldSize % 2 === 0 && fieldSize >= divisionCount;
    return divisionCount > 1 && fieldSize >= divisionCount;
}
function resolvePlayoffPlacementMode(setup) {
    const divisionCount = setup.divisions.length;
    const requested = setup.playoffs.placementMode;
    if (setup.playoffs.bracketType === "ladder") return "overall";
    if (requested !== "auto") {
        return isPlayoffPlacementUsable(requested, divisionCount, setup.playoffs.fieldSize) ? requested : "overall";
    }
    if (divisionCount === 2 && isPlayoffPlacementUsable("division-halves", divisionCount, setup.playoffs.fieldSize)) return "division-halves";
    if (divisionCount >= 3 && divisionCount <= 4 && isPlayoffPlacementUsable("division-leaders", divisionCount, setup.playoffs.fieldSize)) return "division-leaders";
    return "overall";
}
function playoffPlacementLabel(mode) {
    if (mode === "division-halves") return "Division Halves";
    if (mode === "division-leaders") return "Division Leaders Priority";
    return "Overall Standings";
}
function singleEliminationRoundNames(settings, divisionCount) {
    const count = getRequiredPlayoffWeeks(settings.fieldSize, "single-elimination");
    const hasFirstRoundByes = getPlayoffByeCount(settings.fieldSize) > 0;
    const usesTwoDivisionHalves = divisionCount === 2 && settings.bracketType === "single-elimination" && (settings.placementMode === "auto" || settings.placementMode === "division-halves") && isPlayoffPlacementUsable("division-halves", divisionCount, settings.fieldSize);
    return Array.from({
        length: count
    }, (_, index)=>{
        if (index === count - 1) return "Championship";
        if (index === 0 && hasFirstRoundByes) return "Wild Card";
        if (index === count - 2) return usesTwoDivisionHalves ? "Divisional Championship" : "Semifinals";
        return `Round ${index + 1}`;
    });
}
function defaultPlayoffRoundNames(settings, divisionCount) {
    if (settings.bracketType === "ladder") {
        const count = getRequiredPlayoffWeeks(settings.fieldSize, settings.bracketType);
        return Array.from({
            length: count
        }, (_, index)=>index === count - 1 ? "Championship" : `Ladder Round ${index + 1}`);
    }
    return singleEliminationRoundNames(settings, divisionCount);
}
function getPlayoffRoundNames(settings, divisionCount = 0) {
    return defaultPlayoffRoundNames(settings, divisionCount).map((fallback, index)=>settings.roundNames?.[index]?.trim() || fallback);
}
function getPlayoffGameBrandingSlots(settings, divisionCount = 0) {
    const roundNames = getPlayoffRoundNames(settings, divisionCount);
    const gamesPerRound = settings.bracketType === "ladder" ? roundNames.map(()=>1) : (()=>{
        const bracketSize = nextPowerOfTwo(settings.fieldSize);
        const counts = [
            Math.max(1, settings.fieldSize - bracketSize / 2)
        ];
        for(let games = bracketSize / 4; counts.length < roundNames.length; games /= 2){
            counts.push(Math.max(1, Math.round(games)));
        }
        return counts;
    })();
    return roundNames.flatMap((roundName, roundIndex)=>Array.from({
            length: gamesPerRound[roundIndex] ?? 1
        }, (_, gameIndex)=>({
                id: `main-r${roundIndex + 1}-g${gameIndex + 1}`,
                roundIndex,
                gameIndex,
                roundName
            })));
}
function getFirstRoundSeedPairs(fieldSize) {
    const byeCount = getPlayoffByeCount(fieldSize);
    const pairs = [];
    let high = byeCount + 1;
    let low = fieldSize;
    while(high < low){
        pairs.push([
            high,
            low
        ]);
        high += 1;
        low -= 1;
    }
    if (!pairs.length && fieldSize === 2) return [
        [
            1,
            2
        ]
    ];
    return pairs;
}
function divisionHalfSeedSlots(fieldSize) {
    if (fieldSize === 2) return [
        [
            1
        ],
        [
            2
        ]
    ];
    const sides = [
        [],
        []
    ];
    const byeCount = getPlayoffByeCount(fieldSize);
    for(let seed = 1; seed <= byeCount; seed += 1)sides[(seed - 1) % 2].push(seed);
    const pairs = getFirstRoundSeedPairs(fieldSize);
    pairs.forEach((pair, index)=>{
        const side = byeCount > 0 ? index % 2 === 0 ? 1 : 0 : pairs.length === 2 ? index : index < pairs.length / 2 ? index % 2 : (pairs.length - 1 - index) % 2;
        sides[side].push(...pair);
    });
    return sides.map((side)=>side.sort((left, right)=>left - right));
}
function projectPlayoffSeeds(schedule, fieldSize = schedule.setup.playoffs.fieldSize) {
    const normalizedFieldSize = Math.max(2, Math.min(schedule.setup.teams.length, Math.round(fieldSize)));
    const standings = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$standings$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateStandings"])(schedule);
    const standingsPosition = new Map(standings.map((row, index)=>[
            row.teamId,
            index + 1
        ]));
    const standingsById = new Map(standings.map((row)=>[
            row.teamId,
            row
        ]));
    const teamById = new Map(schedule.setup.teams.map((team)=>[
            team.id,
            team
        ]));
    const leaders = schedule.setup.divisions.map((division)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$standings$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateDivisionStandings"])(schedule, division.id)[0]).filter((row)=>Boolean(row)).sort((left, right)=>(standingsPosition.get(left.teamId) ?? Infinity) - (standingsPosition.get(right.teamId) ?? Infinity));
    const leaderIds = new Set(leaders.map((row)=>row.teamId));
    const byeCount = getPlayoffByeCount(normalizedFieldSize);
    const placementMode = resolvePlayoffPlacementMode({
        divisions: schedule.setup.divisions,
        playoffs: {
            ...schedule.setup.playoffs,
            fieldSize: normalizedFieldSize
        }
    });
    const toSeed = (teamId, seed, bracketSide)=>{
        const row = standingsById.get(teamId);
        const team = teamById.get(teamId);
        return {
            seed,
            teamId,
            record: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$standings$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatRecord"])(row),
            divisionLeader: leaderIds.has(teamId),
            divisionId: team.divisionId,
            standingsPosition: standingsPosition.get(teamId) ?? seed,
            bracketSide,
            bye: seed <= byeCount
        };
    };
    if (schedule.setup.playoffs.fieldStatus === "locked" && schedule.setup.playoffs.lockedTeamIds.length >= normalizedFieldSize) {
        const sideBySeed = new Map();
        if (placementMode === "division-halves") {
            divisionHalfSeedSlots(normalizedFieldSize).forEach((side, sideIndex)=>side.forEach((seed)=>sideBySeed.set(seed, sideIndex === 0 ? "A" : "B")));
        }
        return schedule.setup.playoffs.lockedTeamIds.slice(0, normalizedFieldSize).filter((teamId)=>standingsById.has(teamId)).map((teamId, index)=>toSeed(teamId, index + 1, sideBySeed.get(index + 1)));
    }
    if (placementMode === "overall") {
        return standings.slice(0, normalizedFieldSize).map((row, index)=>toSeed(row.teamId, index + 1));
    }
    if (placementMode === "division-leaders") {
        const ordered = [
            ...leaders,
            ...standings.filter((row)=>!leaderIds.has(row.teamId))
        ].slice(0, normalizedFieldSize);
        return ordered.map((row, index)=>toSeed(row.teamId, index + 1));
    }
    const divisionIds = schedule.setup.divisions.map((division)=>division.id);
    const divisionGroups = divisionIds.length === 2 ? [
        [
            divisionIds[0]
        ],
        [
            divisionIds[1]
        ]
    ] : [
        [
            divisionIds[0],
            divisionIds[1]
        ],
        [
            divisionIds[2],
            divisionIds[3]
        ]
    ];
    const selectedSides = divisionGroups.map((group)=>{
        const groupSet = new Set(group);
        const groupRows = standings.filter((row)=>groupSet.has(teamById.get(row.teamId)?.divisionId || ""));
        const groupLeaders = leaders.filter((row)=>groupSet.has(teamById.get(row.teamId)?.divisionId || ""));
        const groupLeaderIds = new Set(groupLeaders.map((row)=>row.teamId));
        return [
            ...groupLeaders,
            ...groupRows.filter((row)=>!groupLeaderIds.has(row.teamId))
        ].slice(0, normalizedFieldSize / 2);
    }).sort((left, right)=>(standingsPosition.get(left[0]?.teamId) ?? 999) - (standingsPosition.get(right[0]?.teamId) ?? 999));
    const slots = divisionHalfSeedSlots(normalizedFieldSize);
    return selectedSides.flatMap((side, sideIndex)=>side.map((row, index)=>toSeed(row.teamId, slots[sideIndex][index], sideIndex === 0 ? "A" : "B"))).sort((left, right)=>left.seed - right.seed);
}
function pairProjectedSeeds(seedNumbers, sideBySeed, keepDivisionHalves) {
    const groups = keepDivisionHalves ? [
        "A",
        "B"
    ].map((side)=>seedNumbers.filter((seed)=>sideBySeed.get(seed) === side)) : [
        seedNumbers
    ];
    return groups.flatMap((group)=>{
        const ordered = [
            ...group
        ].sort((left, right)=>left - right);
        const matchups = [];
        while(ordered.length > 1){
            const homeSeed = ordered.shift();
            const awaySeed = ordered.pop();
            matchups.push({
                homeSeed,
                awaySeed,
                bracketSide: sideBySeed.get(homeSeed)
            });
        }
        return matchups;
    });
}
function projectPlayoffRounds(schedule) {
    const settings = normalizePlayoffSettings(schedule.setup.playoffs, schedule.setup.teams.length, schedule.setup.color, schedule.setup.weeks);
    const normalizedSchedule = settings === schedule.setup.playoffs ? schedule : {
        ...schedule,
        setup: {
            ...schedule.setup,
            playoffs: settings
        }
    };
    const seeds = projectPlayoffSeeds(normalizedSchedule, settings.fieldSize);
    const seedByTeamId = new Map(seeds.map((item)=>[
            item.teamId,
            item.seed
        ]));
    const recordedGames = new Map((schedule.playoffGames ?? []).filter((game)=>game.bracket === "main").map((game)=>[
            game.id,
            game
        ]));
    const roundNames = getPlayoffRoundNames(settings, schedule.setup.divisions.length);
    const sideBySeed = new Map(seeds.map((item)=>[
            item.seed,
            item.bracketSide
        ]));
    if (settings.bracketType === "ladder") {
        return roundNames.map((name, roundIndex)=>{
            const homeSeed = settings.fieldSize - roundIndex - 1;
            return {
                roundIndex,
                name,
                weekNumber: schedule.setup.weeks + roundIndex + 1,
                matchups: [
                    {
                        homeSeed,
                        awaySeed: homeSeed + 1
                    }
                ],
                byeSeeds: seeds.map((item)=>item.seed).filter((seed)=>seed < homeSeed)
            };
        });
    }
    const placement = resolvePlayoffPlacementMode({
        divisions: schedule.setup.divisions,
        playoffs: settings
    });
    const openingPairs = getFirstRoundSeedPairs(settings.fieldSize);
    const openingMatchups = openingPairs.map(([homeSeed, awaySeed])=>({
            homeSeed,
            awaySeed,
            bracketSide: sideBySeed.get(homeSeed)
        }));
    let advancingSeeds = seeds.filter((item)=>item.bye).map((item)=>item.seed);
    return roundNames.map((name, roundIndex)=>{
        const matchups = roundIndex === 0 ? openingMatchups : pairProjectedSeeds(advancingSeeds, sideBySeed, placement === "division-halves" && roundIndex < roundNames.length - 1);
        const byeSeeds = roundIndex === 0 ? seeds.filter((item)=>item.bye).map((item)=>item.seed) : [];
        const winners = matchups.map((matchup, gameIndex)=>{
            const recorded = recordedGames.get(`main-r${roundIndex + 1}-g${gameIndex + 1}`);
            if (recorded?.homeScore == null || recorded.awayScore == null || recorded.homeScore === recorded.awayScore) {
                return matchup.homeSeed;
            }
            const winnerTeamId = recorded.homeScore > recorded.awayScore ? recorded.homeTeamId : recorded.awayTeamId;
            return seedByTeamId.get(winnerTeamId) ?? matchup.homeSeed;
        });
        advancingSeeds = [
            ...byeSeeds,
            ...winners
        ].sort((left, right)=>left - right);
        return {
            roundIndex,
            name,
            weekNumber: schedule.setup.weeks + roundIndex + 1,
            matchups,
            byeSeeds
        };
    });
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/storage.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createLocalSeasonId",
    ()=>createLocalSeasonId,
    "listLocalSeasons",
    ()=>listLocalSeasons,
    "loadSeasonById",
    ()=>loadSeasonById,
    "loadSetup",
    ()=>loadSetup,
    "normalizeSeason",
    ()=>normalizeSeason,
    "normalizeSetup",
    ()=>normalizeSetup,
    "removeLocalSeason",
    ()=>removeLocalSeason,
    "saveSeason",
    ()=>saveSeason,
    "saveSetup",
    ()=>saveSetup
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$matchups$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/matchups.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/monograms.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$playoffs$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/playoffs.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$rankings$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/rankings.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$standings$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/standings.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$tiebreakers$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/tiebreakers.ts [app-ssr] (ecmascript)");
;
;
;
;
;
;
function normalizeSetup(setup) {
    const hasLeagueInitials = Object.prototype.hasOwnProperty.call(setup, "initials");
    const initials = hasLeagueInitials ? setup.initials : setup.abbreviation || undefined;
    return {
        ...setup,
        abbreviation: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["leagueAcronym"])(setup.name),
        initials,
        display: setup.display || {
            cityNames: true,
            managers: true,
            venues: true
        },
        priorSeason: {
            ...setup.priorSeason,
            hasData: setup.priorSeason.hasData ?? setup.priorSeason.enabled,
            entryMode: setup.priorSeason.entryMode ?? (setup.priorSeason.enabled ? setup.priorSeason.hasData ? "history" : "manual" : "none")
        },
        weekOne: setup.weekOne || {
            rankingSource: "prior-season"
        },
        tiebreakers: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$tiebreakers$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizeTiebreakerSettings"])(setup.tiebreakers),
        playoffs: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$playoffs$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizePlayoffSettings"])(setup.playoffs, setup.teams.length, setup.color, setup.weeks),
        platformConnection: setup.platformConnection ? {
            ...setup.platformConnection,
            syncMode: setup.platformConnection.syncMode ?? "manual",
            authType: setup.platformConnection.authType ?? "public",
            status: setup.platformConnection.status ?? "idle",
            warnings: setup.platformConnection.warnings ?? []
        } : undefined,
        divisions: setup.divisions.map((division)=>({
                ...division,
                initials: Object.prototype.hasOwnProperty.call(division, "initials") ? division.initials : undefined
            })),
        teams: setup.teams.map((team)=>{
            const { draftScore: legacyDraftScore, ...teamWithoutLegacyScore } = team;
            const city = team.city || "";
            const teamInitials = Object.prototype.hasOwnProperty.call(team, "initials") ? team.initials : team.shortName || undefined;
            const storedDraftPlace = Number.isInteger(team.draftPlace) && team.draftPlace >= 1 && team.draftPlace <= setup.teams.length ? team.draftPlace : undefined;
            const migratedDraftPlace = Number.isInteger(legacyDraftScore) && legacyDraftScore >= 1 && legacyDraftScore <= setup.teams.length ? legacyDraftScore : undefined;
            return {
                ...teamWithoutLegacyScore,
                providerId: team.providerId,
                city,
                initials: teamInitials,
                draftPlace: storedDraftPlace ?? migratedDraftPlace,
                shortName: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveInitials"])(teamInitials, (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$monograms$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["entityMonogram"])(team.name, city))
            };
        })
    };
}
const SETUP_KEY = "leagueweaver:v3:setup";
/** Legacy single-slot season key. Read once and migrated into SEASONS_KEY. */ const SEASON_KEY = "leagueweaver:v3:season";
/** Keyed store of every schedule saved on this device, indexed by schedule id. */ const SEASONS_KEY = "leagueweaver:v3:seasons";
function createLocalSeasonId() {
    const random = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
    return `local-${random}`;
}
function readSeasonStore() {
    if ("TURBOPACK compile-time truthy", 1) return {};
    //TURBOPACK unreachable
    ;
    let store;
}
function writeSeasonStore(store) {
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
}
function normalizeSeason(schedule) {
    const hadTiebreakerSettings = Boolean(schedule.setup.tiebreakers);
    const setup = normalizeSetup(schedule.setup);
    const preseasonRanks = new Map(setup.teams.map((team)=>[
            team.id,
            team.overallRank
        ]));
    const openingWeekRanks = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$rankings$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getWeekOneRankMap"])(setup);
    return {
        ...schedule,
        setup,
        rankHistory: hadTiebreakerSettings ? schedule.rankHistory : undefined,
        weeks: (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$matchups$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizeScheduleMatchups"])(schedule.weeks, (weekNumber)=>weekNumber === 1 ? openingWeekRanks : preseasonRanks)
    };
}
function saveSetup(setup) {
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
}
function loadSetup() {
    if ("TURBOPACK compile-time truthy", 1) return null;
    //TURBOPACK unreachable
    ;
}
function saveSeason(schedule) {
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
    const normalized = undefined;
    const store = undefined;
}
function loadSeasonById(id) {
    if ("TURBOPACK compile-time truthy", 1) return null;
    //TURBOPACK unreachable
    ;
    const entry = undefined;
}
function listLocalSeasons() {
    return Object.values(readSeasonStore()).map(({ schedule, savedAt })=>({
            id: schedule.id,
            name: schedule.setup?.name?.trim() || "Untitled league",
            seasonYear: schedule.setup?.seasonYear ?? 0,
            teamCount: schedule.setup?.teams?.length ?? 0,
            savedAt
        })).sort((a, b)=>b.savedAt - a.savedAt);
}
function removeLocalSeason(id) {
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
    const store = undefined;
}
}),
"[project]/.claude/worktrees/playoff-suite/components/account/SignupProfileFields.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SignupProfileFields",
    ()=>SignupProfileFields
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$image$2d$plus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ImagePlus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/image-plus.mjs [app-ssr] (ecmascript) <export default as ImagePlus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LoaderCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.mjs [app-ssr] (ecmascript) <export default as LoaderCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/sparkles.mjs [app-ssr] (ecmascript) <export default as Sparkles>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trash-2.mjs [app-ssr] (ecmascript) <export default as Trash2>");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$imageColors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/imageColors.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/storage.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
function SignupProfileFields({ onChange }) {
    const [leagueName, setLeagueName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [avatarUrl, setAvatarUrl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [busy, setBusy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [leagueLogo, setLeagueLogo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const inputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Offer the league logo the commissioner is already building with as a one-tap avatar.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const logo = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["loadSetup"])()?.logoUrl;
        if (logo) setLeagueLogo(logo);
    }, []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        onChange({
            leagueName,
            avatarUrl,
            busy
        });
    }, [
        leagueName,
        avatarUrl,
        busy,
        onChange
    ]);
    const pickAvatar = async (file)=>{
        if (!file) return;
        if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) {
            setError("Choose a PNG, JPG, or WebP image under 8 MB.");
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const analyzed = await (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$imageColors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["analyzeIdentityImage"])(file);
            setAvatarUrl(analyzed.logoUrl);
        } catch  {
            setError("That image could not be read. Try a different one.");
        } finally{
            setBusy(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "signup-avatar",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: `signup-avatar-preview${avatarUrl ? " has-image" : ""}`,
                        "aria-hidden": "true",
                        children: avatarUrl ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                            src: avatarUrl,
                            alt: ""
                        }, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignupProfileFields.tsx",
                            lineNumber: 49,
                            columnNumber: 115
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$image$2d$plus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ImagePlus$3e$__["ImagePlus"], {}, void 0, false, {
                            fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignupProfileFields.tsx",
                            lineNumber: 49,
                            columnNumber: 148
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignupProfileFields.tsx",
                        lineNumber: 49,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "signup-avatar-actions",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "signup-avatar-label",
                                children: [
                                    "Profile image ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("em", {
                                        children: "Optional"
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignupProfileFields.tsx",
                                        lineNumber: 51,
                                        columnNumber: 63
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignupProfileFields.tsx",
                                lineNumber: 51,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "signup-avatar-buttons",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: "button-secondary",
                                        disabled: busy,
                                        onClick: ()=>inputRef.current?.click(),
                                        children: [
                                            busy ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LoaderCircle$3e$__["LoaderCircle"], {
                                                className: "spin"
                                            }, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignupProfileFields.tsx",
                                                lineNumber: 53,
                                                columnNumber: 130
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$image$2d$plus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ImagePlus$3e$__["ImagePlus"], {}, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignupProfileFields.tsx",
                                                lineNumber: 53,
                                                columnNumber: 166
                                            }, this),
                                            avatarUrl ? "Change" : "Upload"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignupProfileFields.tsx",
                                        lineNumber: 53,
                                        columnNumber: 13
                                    }, this),
                                    leagueLogo && avatarUrl !== leagueLogo && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: "signup-avatar-suggest",
                                        disabled: busy,
                                        onClick: ()=>{
                                            setAvatarUrl(leagueLogo);
                                            setError(null);
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__["Sparkles"], {}, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignupProfileFields.tsx",
                                                lineNumber: 54,
                                                columnNumber: 190
                                            }, this),
                                            "Use your league logo"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignupProfileFields.tsx",
                                        lineNumber: 54,
                                        columnNumber: 56
                                    }, this),
                                    avatarUrl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: "signup-avatar-remove",
                                        "aria-label": "Remove profile image",
                                        onClick: ()=>setAvatarUrl(null),
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {}, void 0, false, {
                                            fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignupProfileFields.tsx",
                                            lineNumber: 55,
                                            columnNumber: 151
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignupProfileFields.tsx",
                                        lineNumber: 55,
                                        columnNumber: 27
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignupProfileFields.tsx",
                                lineNumber: 52,
                                columnNumber: 11
                            }, this),
                            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                className: "signup-avatar-error",
                                role: "alert",
                                children: error
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignupProfileFields.tsx",
                                lineNumber: 57,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignupProfileFields.tsx",
                        lineNumber: 50,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        ref: inputRef,
                        type: "file",
                        accept: "image/png,image/jpeg,image/webp",
                        hidden: true,
                        onChange: (event)=>{
                            void pickAvatar(event.target.files?.[0]);
                            event.target.value = "";
                        }
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignupProfileFields.tsx",
                        lineNumber: 59,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignupProfileFields.tsx",
                lineNumber: 48,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "League name"
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignupProfileFields.tsx",
                        lineNumber: 61,
                        columnNumber: 14
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "text",
                        autoComplete: "organization",
                        required: true,
                        value: leagueName,
                        onChange: (event)=>setLeagueName(event.target.value)
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignupProfileFields.tsx",
                        lineNumber: 61,
                        columnNumber: 38
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                        className: "field-hint",
                        children: "Shown on your account — usually your league’s name."
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignupProfileFields.tsx",
                        lineNumber: 61,
                        columnNumber: 171
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignupProfileFields.tsx",
                lineNumber: 61,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/apiErrors.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RATE_LIMIT_MESSAGE",
    ()=>RATE_LIMIT_MESSAGE,
    "apiErrorMessage",
    ()=>apiErrorMessage,
    "friendlyAuthMessage",
    ()=>friendlyAuthMessage
]);
const RATE_LIMIT_MESSAGE = "League Weaver is busy right now. Try again in a few minutes.";
const FALLBACK_API_MESSAGE = "Something went wrong. Try again soon.";
function apiErrorMessage(status, message, fallback = FALLBACK_API_MESSAGE) {
    if (status === 429) return RATE_LIMIT_MESSAGE;
    return message?.trim() || fallback;
}
function friendlyAuthMessage(message) {
    const normalized = message?.toLowerCase() ?? "";
    if (/invalid|credential|login/.test(normalized)) return "That email or password does not match.";
    if (/already|registered|exists|duplicate/.test(normalized)) return "This email already has an account. Try signing in.";
    if (/weak|password.*short|at least|minimum|characters/.test(normalized)) return "Use at least 8 characters.";
    if (/confirm|verify|email.*not/.test(normalized)) return "Check your email to finish setting up your account.";
    return "Account sign-in is temporarily unavailable. Try again soon.";
}
}),
"[project]/.claude/worktrees/playoff-suite/lib/supabase/env.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/.claude/worktrees/playoff-suite/lib/supabase/client.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createClient",
    ()=>createClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createBrowserClient$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createBrowserClient.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$supabase$2f$env$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/supabase/env.ts [app-ssr] (ecmascript)");
;
;
function createClient() {
    const env = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$supabase$2f$env$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getSupabaseEnv"])();
    if (!env) return null;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createBrowserClient$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createBrowserClient"])(env.url, env.key);
}
}),
"[project]/.claude/worktrees/playoff-suite/components/account/SignInModal.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SignInModal",
    ()=>SignInModal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/eye.mjs [app-ssr] (ecmascript) <export default as Eye>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2d$off$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__EyeOff$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/eye-off.mjs [app-ssr] (ecmascript) <export default as EyeOff>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LoaderCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.mjs [app-ssr] (ecmascript) <export default as LoaderCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.mjs [app-ssr] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$Modal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/components/ui/Modal.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$Tooltip$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/components/ui/Tooltip.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$account$2f$SignupProfileFields$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/components/account/SignupProfileFields.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$apiErrors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/apiErrors.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/lib/supabase/client.ts [app-ssr] (ecmascript)");
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
function SignInModal({ initialMode = "signin", onClose }) {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const [mode, setMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(initialMode);
    const [email, setEmail] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [password, setPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [showPassword, setShowPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [profile, setProfile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        leagueName: "",
        avatarUrl: null,
        busy: false
    });
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [message, setMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createClient"])();
    const submit = async (event)=>{
        event.preventDefault();
        if (!supabase) return setMessage("Supabase is not configured for this environment yet.");
        setLoading(true);
        setMessage(null);
        if (mode === "signin") {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            setLoading(false);
            if (error) return setMessage((0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$apiErrors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["friendlyAuthMessage"])(error.message));
            onClose();
            router.refresh();
            return;
        }
        const leagueName = profile.leagueName.trim();
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname + window.location.search)}`,
                data: {
                    full_name: leagueName,
                    display_name: leagueName,
                    ...profile.avatarUrl ? {
                        avatar_url: profile.avatarUrl
                    } : {}
                }
            }
        });
        setLoading(false);
        setMessage(error ? (0, __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$lib$2f$apiErrors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["friendlyAuthMessage"])(error.message) : "Check your email to finish setting up your account.");
    };
    const isSignup = mode === "signup";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$Modal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Modal"], {
        onClose: onClose,
        className: "account-card auth-modal-card",
        labelledBy: "auth-modal-title",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                className: "icon-button auth-modal-close",
                "aria-label": "Close sign in",
                onClick: onClose,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {}, void 0, false, {
                    fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignInModal.tsx",
                    lineNumber: 61,
                    columnNumber: 117
                }, this)
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignInModal.tsx",
                lineNumber: 61,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "eyebrow",
                children: "Commissioner account"
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignInModal.tsx",
                lineNumber: 62,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                id: "auth-modal-title",
                children: isSignup ? "Save your league once." : "Welcome back."
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignInModal.tsx",
                lineNumber: 63,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: isSignup ? "Next season, skip league, team, and division setup." : "Pick up saved leagues and seasons on any device."
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignInModal.tsx",
                lineNumber: 64,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "account-tabs",
                role: "tablist",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: !isSignup ? "active" : "",
                        onClick: ()=>setMode("signin"),
                        children: "Sign in"
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignInModal.tsx",
                        lineNumber: 65,
                        columnNumber: 54
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: isSignup ? "active" : "",
                        onClick: ()=>setMode("signup"),
                        children: "Create account"
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignInModal.tsx",
                        lineNumber: 65,
                        columnNumber: 164
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignInModal.tsx",
                lineNumber: 65,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                onSubmit: submit,
                children: [
                    isSignup && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$account$2f$SignupProfileFields$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SignupProfileFields"], {
                        onChange: setProfile
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignInModal.tsx",
                        lineNumber: 67,
                        columnNumber: 24
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Email"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignInModal.tsx",
                                lineNumber: 68,
                                columnNumber: 18
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "email",
                                autoComplete: "email",
                                required: true,
                                value: email,
                                onChange: (event)=>setEmail(event.target.value)
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignInModal.tsx",
                                lineNumber: 68,
                                columnNumber: 36
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignInModal.tsx",
                        lineNumber: 68,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Password"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignInModal.tsx",
                                lineNumber: 69,
                                columnNumber: 18
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "password-input",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: showPassword ? "text" : "password",
                                        autoComplete: isSignup ? "new-password" : "current-password",
                                        minLength: 8,
                                        required: true,
                                        value: password,
                                        onChange: (event)=>setPassword(event.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignInModal.tsx",
                                        lineNumber: 69,
                                        columnNumber: 71
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$ui$2f$Tooltip$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Tooltip"], {
                                        label: showPassword ? "Hide password" : "Show password",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            "aria-label": showPassword ? "Hide password" : "Show password",
                                            onClick: ()=>setShowPassword((current)=>!current),
                                            children: showPassword ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2d$off$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__EyeOff$3e$__["EyeOff"], {}, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignInModal.tsx",
                                                lineNumber: 69,
                                                columnNumber: 499
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__["Eye"], {}, void 0, false, {
                                                fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignInModal.tsx",
                                                lineNumber: 69,
                                                columnNumber: 512
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignInModal.tsx",
                                            lineNumber: 69,
                                            columnNumber: 344
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignInModal.tsx",
                                        lineNumber: 69,
                                        columnNumber: 278
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignInModal.tsx",
                                lineNumber: 69,
                                columnNumber: 39
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignInModal.tsx",
                        lineNumber: 69,
                        columnNumber: 11
                    }, this),
                    message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "account-message",
                        role: "status",
                        children: message
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignInModal.tsx",
                        lineNumber: 70,
                        columnNumber: 23
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "button-primary account-submit",
                        disabled: loading || profile.busy,
                        children: [
                            loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LoaderCircle$3e$__["LoaderCircle"], {
                                className: "spin"
                            }, void 0, false, {
                                fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignInModal.tsx",
                                lineNumber: 71,
                                columnNumber: 108
                            }, this),
                            isSignup ? "Create free account" : "Sign in"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignInModal.tsx",
                        lineNumber: 71,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignInModal.tsx",
                lineNumber: 66,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                className: "account-legal",
                children: [
                    "By continuing, you agree to the ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/terms",
                        children: "Terms"
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignInModal.tsx",
                        lineNumber: 73,
                        columnNumber: 74
                    }, this),
                    " and ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/privacy",
                        children: "Privacy Policy"
                    }, void 0, false, {
                        fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignInModal.tsx",
                        lineNumber: 73,
                        columnNumber: 111
                    }, this),
                    "."
                ]
            }, void 0, true, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignInModal.tsx",
                lineNumber: 73,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/account/SignInModal.tsx",
        lineNumber: 60,
        columnNumber: 5
    }, this);
}
}),
"[project]/.claude/worktrees/playoff-suite/components/account/AuthModalProvider.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthModalProvider",
    ()=>AuthModalProvider,
    "useAuthModal",
    ()=>useAuthModal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$account$2f$SignInModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/.claude/worktrees/playoff-suite/components/account/SignInModal.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
const AuthModalContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])({
    // Graceful fallback if a trigger ever renders outside the provider.
    openSignIn: ()=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
    }
});
function useAuthModal() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(AuthModalContext);
}
function AuthModalProvider({ children }) {
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        open: false,
        mode: "signin"
    });
    const openSignIn = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((mode = "signin")=>setState({
            open: true,
            mode
        }), []);
    const close = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>setState((current)=>({
                ...current,
                open: false
            })), []);
    const value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>({
            openSignIn
        }), [
        openSignIn
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthModalContext.Provider, {
        value: value,
        children: [
            children,
            state.open && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f2e$claude$2f$worktrees$2f$playoff$2d$suite$2f$components$2f$account$2f$SignInModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SignInModal"], {
                initialMode: state.mode,
                onClose: close
            }, void 0, false, {
                fileName: "[project]/.claude/worktrees/playoff-suite/components/account/AuthModalProvider.tsx",
                lineNumber: 27,
                columnNumber: 22
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/.claude/worktrees/playoff-suite/components/account/AuthModalProvider.tsx",
        lineNumber: 25,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__646b50b2._.js.map