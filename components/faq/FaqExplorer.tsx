"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Compass, HelpCircle, LayoutDashboard, Search, Share2, ShieldCheck, Trophy, Users } from "lucide-react";

type FaqCategory = "All" | "What" | "Why" | "Structure" | "Features" | "Wizard" | "Using" | "Platforms" | "Pages" | "Sharing";

type FaqItem = {
  category: Exclude<FaqCategory, "All">;
  question: string;
  answer: string;
  tags: string[];
};

const categories: { label: FaqCategory; hint: string }[] = [
  { label: "All", hint: "Everything" },
  { label: "What", hint: "Basics" },
  { label: "Why", hint: "Strategy" },
  { label: "Structure", hint: "Schedule design" },
  { label: "Features", hint: "Special tools" },
  { label: "Wizard", hint: "Step by step" },
  { label: "Using", hint: "Workflow" },
  { label: "Platforms", hint: "ESPN and Sleeper" },
  { label: "Pages", hint: "Where things live" },
  { label: "Sharing", hint: "Exports and privacy" },
];

const faqs: FaqItem[] = [
  {
    category: "What",
    question: "What is League Weaver?",
    answer: "League Weaver is a fantasy football commissioner tool that builds NFL-style schedules and gives you a season workspace for matchups, scores, standings, exports, and sharing.",
    tags: ["league weaver", "fantasy football schedule generator", "commissioner tool", "season workspace"],
  },
  {
    category: "What",
    question: "Is League Weaver a replacement for ESPN or Sleeper?",
    answer: "No. League Weaver works beside your league platform. Use ESPN or Sleeper for your official fantasy league, and use League Weaver to design, manage, export, and share a better schedule.",
    tags: ["espn", "sleeper", "platform", "official league"],
  },
  {
    category: "What",
    question: "What problem does League Weaver solve?",
    answer: "It solves the commissioner problem of turning a plain fantasy fixture list into a structured season with divisions, storylines, useful exports, score tracking, standings, and public communication tools.",
    tags: ["problem", "commissioner", "fixture list", "storylines", "schedule"],
  },
  {
    category: "What",
    question: "What is a commissioner workspace?",
    answer: "A commissioner workspace is the season control room after generation. It keeps the league schedule, team schedules, weekly slate, standings, playoff picture, sharing, settings, and copy sheets together.",
    tags: ["commissioner workspace", "season workspace", "control room", "weekly slate"],
  },
  {
    category: "What",
    question: "What is a saved schedule?",
    answer: "A saved schedule is a generated season you can reopen later. It includes the league setup, matchups, teams, divisions, scores, standings context, exports, and share settings tied to that season.",
    tags: ["saved schedule", "generated season", "reopen", "season"],
  },
  {
    category: "What",
    question: "What is a saved league?",
    answer: "A saved league is a reusable league setup. It stores league identity, teams, divisions, colors, logos, and related details so next season starts faster.",
    tags: ["saved league", "reuse", "league identity", "teams", "logos"],
  },
  {
    category: "What",
    question: "What is the difference between a league and a schedule?",
    answer: "The league is the reusable group of teams and divisions. The schedule is one season generated from that league setup, with weeks, matchups, scores, standings, exports, and share links.",
    tags: ["league vs schedule", "saved league", "saved schedule", "season"],
  },
  {
    category: "What",
    question: "What is a public share page?",
    answer: "A public share page is a clean league-facing schedule link. It lets managers open the schedule without signing in, while the commissioner controls which public details are shown.",
    tags: ["public share", "share page", "league link", "privacy"],
  },
  {
    category: "What",
    question: "What is a Copy Sheet?",
    answer: "Copy Sheet is a workspace page that formats the generated schedule so a commissioner can copy or reference it while updating ESPN, Sleeper, or league documents.",
    tags: ["copy sheet", "prints", "espn", "sleeper", "copy schedule"],
  },
  {
    category: "What",
    question: "What is matchup quality?",
    answer: "Matchup quality is League Weaver's way of helping commissioners spot stronger games. It supports views like Game of the Week and Matchup Ratings so the schedule has visible storylines.",
    tags: ["matchup quality", "matchup ratings", "game of the week", "storylines"],
  },
  {
    category: "What",
    question: "What is manual score entry?",
    answer: "Manual score entry lets commissioners enter results directly in League Weaver when automated score sync is not being used. Those scores power standings, playoff views, and season context.",
    tags: ["manual scores", "score entry", "standings", "results"],
  },
  {
    category: "What",
    question: "What is revision history?",
    answer: "Revision history keeps earlier saved versions of a schedule available when supported by the account flow, so a commissioner can recover or compare prior work instead of losing the whole setup.",
    tags: ["revision history", "restore", "saved schedule", "account"],
  },
  {
    category: "What",
    question: "What does free MVP access include?",
    answer: "The MVP release is free and focused on the core season flow: schedule generation, saved schedules, manual score entry, standings, exports, public sharing, and saved league reuse.",
    tags: ["free", "mvp", "pricing", "included", "access"],
  },
  {
    category: "What",
    question: "What information should I have ready before building?",
    answer: "Have your league name, teams, divisions, season year, regular-season length, playoff format, and any prior-season or draft-order preference ready. ESPN or Sleeper imports can fill some of that faster.",
    tags: ["before building", "league name", "teams", "season year", "playoffs", "draft order"],
  },
  {
    category: "What",
    question: "What makes League Weaver different from a spreadsheet?",
    answer: "A spreadsheet can list games. League Weaver understands league structure, validates setup choices, creates schedule moments, saves seasons, shows standings, exports cleanly, and gives the league a polished share page.",
    tags: ["spreadsheet", "schedule generator", "validation", "share page"],
  },
  {
    category: "Why",
    question: "Why use League Weaver instead of a basic round-robin schedule?",
    answer: "A flat round-robin can feel random. League Weaver adds structure: division games, rivalry weeks, marquee matchups, Game of the Week labels, and a finish that feels more like a real football season.",
    tags: ["round robin", "nfl style", "rivalry week", "game of the week", "marquee"],
  },
  {
    category: "Why",
    question: "Who is League Weaver built for?",
    answer: "It is built for commissioners who care about the league experience: fairness, storylines, clean communication, and a schedule that gives managers something to talk about all season.",
    tags: ["commissioner", "fairness", "storylines", "league experience"],
  },
  {
    category: "Why",
    question: "Why does schedule structure matter in fantasy football?",
    answer: "Structure gives the season rhythm. Divisions, repeat games, rivalry windows, and a stronger finish make the schedule easier to understand and more fun to talk about.",
    tags: ["schedule structure", "rhythm", "divisions", "rivalries", "finish"],
  },
  {
    category: "Why",
    question: "Why should commissioners care about repeat opponents?",
    answer: "Repeat opponents create history. They make division races, revenge games, and playoff pushes feel earned instead of random.",
    tags: ["repeat opponents", "revenge games", "division races", "playoff push"],
  },
  {
    category: "Why",
    question: "Why use prior-season results or seeding?",
    answer: "Prior-season results help the new schedule respond to what actually happened. Strong teams can get bigger spotlight games, and the league feels connected across seasons.",
    tags: ["prior season", "seeding", "history", "spotlight games"],
  },
  {
    category: "Why",
    question: "Why have a Game of the Week?",
    answer: "Game of the Week gives the commissioner an easy weekly headline. It helps managers know which matchup matters most and turns the schedule into league content.",
    tags: ["game of the week", "headline", "league content", "weekly"],
  },
  {
    category: "Why",
    question: "Why use a public share page?",
    answer: "A public share page gives managers one clean place to check the schedule without digging through chat threads, screenshots, or platform menus.",
    tags: ["public share", "league communication", "managers", "schedule link"],
  },
  {
    category: "Why",
    question: "Why keep saved leagues?",
    answer: "Saved leagues protect the work you already did. Once teams, divisions, colors, and logos are right, you can reuse them instead of rebuilding the league every season.",
    tags: ["saved leagues", "reuse", "teams", "logos", "next season"],
  },
  {
    category: "Why",
    question: "Why track scores in League Weaver if my platform already has scores?",
    answer: "League Weaver uses scores to power its own standings, playoff picture, team pages, and commissioner views. It is useful when you want the schedule story and results in the same workspace.",
    tags: ["scores", "standings", "playoff picture", "workspace"],
  },
  {
    category: "Why",
    question: "Why use exports if the schedule is already online?",
    answer: "Exports help commissioners post, archive, print, copy, and double-check the schedule outside the app. They are useful for league chats, documents, platform entry, and commissioner records.",
    tags: ["exports", "pdf", "csv", "copy sheet", "archive"],
  },
  {
    category: "Structure",
    question: "What does NFL-style schedule structure mean?",
    answer: "It means the schedule is shaped with purpose instead of just rotating teams. League Weaver can account for divisions, repeat opponents, marquee weeks, rivalry games, bye logic, and a stronger late-season finish.",
    tags: ["schedule structure", "nfl style", "divisions", "repeat opponents", "bye weeks", "late season"],
  },
  {
    category: "Structure",
    question: "How do divisions affect the schedule?",
    answer: "Divisions give the season a spine. League Weaver uses them to create more meaningful repeat matchups, easier standings stories, rivalry windows, and playoff context that a standard fantasy schedule usually skips.",
    tags: ["divisions", "division games", "standings", "rivalries", "playoffs"],
  },
  {
    category: "Structure",
    question: "Can the schedule create rivalry weeks and marquee games?",
    answer: "Yes. League Weaver is built around the idea that certain weeks should feel bigger. It can surface rivalry matchups, Game of the Week candidates, Thanksgiving-style spotlight games, and important closing-week matchups.",
    tags: ["rivalry week", "marquee games", "thanksgiving", "game of the week", "spotlight"],
  },
  {
    category: "Structure",
    question: "Does League Weaver think about fairness?",
    answer: "Yes. The builder lets commissioners review schedule rules and generate a balanced slate. The goal is to avoid obvious unfairness while still keeping the season dramatic and easy to follow.",
    tags: ["fairness", "balanced schedule", "rules", "commissioner review", "strength"],
  },
  {
    category: "Features",
    question: "What features are not standard in normal fantasy platforms?",
    answer: "League Weaver adds commissioner-first tools like schedule storytelling, matchup labels, public share controls, PDF and CSV exports, reusable saved leagues, revision history, manual score entry, standings views, playoff views, and team schedule pages.",
    tags: ["features", "matchup labels", "exports", "saved leagues", "revision history", "score entry", "playoff views"],
  },
  {
    category: "Features",
    question: "What is Game of the Week?",
    answer: "Game of the Week highlights the matchup that deserves extra attention. It helps commissioners create weekly storylines instead of sending managers a plain list of games.",
    tags: ["game of the week", "gotw", "weekly storylines", "matchup quality"],
  },
  {
    category: "Features",
    question: "What are playoff previews for?",
    answer: "Playoff previews help commissioners see how the configured playoff format will look before the season is locked in. That makes it easier to catch bracket, seed, and consolation setup issues early.",
    tags: ["playoff preview", "bracket", "seeds", "consolation", "playoff setup"],
  },
  {
    category: "Features",
    question: "What can I track after the schedule is generated?",
    answer: "The season workspace can track matchups, scores, standings, team schedules, playoff views, share settings, exports, and league communication details from one place.",
    tags: ["season workspace", "scores", "standings", "team schedules", "exports", "share settings"],
  },
  {
    category: "Wizard",
    question: "What are the six builder steps?",
    answer: "The builder moves through Source, League, Teams & Divisions, Season & Rules, Playoffs, and Review & Generate. Some steps have sub-tabs so the setup stays organized instead of becoming one long form.",
    tags: ["wizard", "builder steps", "source", "league", "teams divisions", "season rules", "playoffs", "review"],
  },
  {
    category: "Wizard",
    question: "Step 1: What is Source for?",
    answer: "Source is where you choose how to start: manual setup, ESPN import, Sleeper import, CSV import, or a saved league. It decides how much setup League Weaver can prefill before you review.",
    tags: ["step 1", "source", "manual", "espn import", "sleeper import", "csv", "saved league"],
  },
  {
    category: "Wizard",
    question: "Step 2: What is League for?",
    answer: "League is where you confirm league identity: name, season context, colors, logos, and the high-level details that make the schedule feel like your league.",
    tags: ["step 2", "league", "identity", "name", "colors", "logos"],
  },
  {
    category: "Wizard",
    question: "Step 3: What happens in Teams & Divisions?",
    answer: "Teams & Divisions is the big structure step. It includes Teams, Division Count, optional Conferences, Set Divisions, and Assign Teams so rosters and competitive groups are correct before scheduling.",
    tags: ["step 3", "teams divisions", "teams", "division count", "conferences", "set divisions", "assign teams"],
  },
  {
    category: "Wizard",
    question: "What does the Teams sub-tab do?",
    answer: "Teams is where you confirm team names, managers, logos, colors, and roster identity. If you imported a league, this is where you clean up names before moving forward.",
    tags: ["teams sub-tab", "team names", "managers", "logos", "colors", "import review"],
  },
  {
    category: "Wizard",
    question: "What does the Division Count sub-tab do?",
    answer: "Division Count sets how many divisions the league uses. It helps League Weaver understand repeat opponents, rivalry structure, standings groups, and playoff qualification options.",
    tags: ["division count", "divisions", "repeat opponents", "playoff qualification"],
  },
  {
    category: "Wizard",
    question: "What does the Conferences sub-tab do?",
    answer: "Conferences appears only when the league structure supports them. It lets bigger leagues group divisions above the division level for a more NFL-like layout.",
    tags: ["conferences", "bigger leagues", "nfl layout", "divisions"],
  },
  {
    category: "Wizard",
    question: "What does Set Divisions do?",
    answer: "Set Divisions lets you name and brand each division. This is where a commissioner can make divisions feel like real league identities, not generic buckets.",
    tags: ["set divisions", "division names", "division logos", "division colors", "branding"],
  },
  {
    category: "Wizard",
    question: "What does Assign Teams do?",
    answer: "Assign Teams places each team into a division. Balanced assignments matter because they affect division games, standings stories, and some playoff qualification paths.",
    tags: ["assign teams", "balanced divisions", "team assignment", "division games"],
  },
  {
    category: "Wizard",
    question: "Step 4: What happens in Season & Rules?",
    answer: "Season & Rules sets the schedule calendar and competitive logic. It includes Season, Seeding, Week 1, and Rules so the regular season has the right length, order, opening slate, and fairness settings.",
    tags: ["step 4", "season rules", "season", "seeding", "week 1", "rules", "fairness"],
  },
  {
    category: "Wizard",
    question: "What does the Season sub-tab do?",
    answer: "Season sets the season year and regular-season length. That choice affects week windows, playoff room, and how much schedule space League Weaver has to work with.",
    tags: ["season sub-tab", "season year", "regular season length", "week windows"],
  },
  {
    category: "Wizard",
    question: "What does the Seeding sub-tab do?",
    answer: "Seeding controls how League Weaver understands last season or draft order. Commissioners can use history, manual ordering, or random order depending on how much structure they want.",
    tags: ["seeding", "prior season", "manual order", "random order", "draft order"],
  },
  {
    category: "Wizard",
    question: "What does the Week 1 sub-tab do?",
    answer: "Week 1 helps shape the opening slate. It can use the seeding or draft-day order so the first week feels intentional instead of randomly assigned.",
    tags: ["week 1", "opening week", "draft-day order", "opening slate"],
  },
  {
    category: "Wizard",
    question: "What does the Rules sub-tab do?",
    answer: "Rules controls fairness and season moments. This is where the commissioner can tune how strict the schedule should be around balance, marquee moments, and league personality.",
    tags: ["rules", "fairness", "season moments", "balance", "marquee"],
  },
  {
    category: "Wizard",
    question: "Step 5: What happens in Playoffs?",
    answer: "Playoffs shapes the postseason before the season is generated. It includes Format, Rules, Brand, and Logos so the bracket, qualification, reseeding, consolation, and playoff identity are clear.",
    tags: ["step 5", "playoffs", "format", "rules", "brand", "logos", "consolation"],
  },
  {
    category: "Wizard",
    question: "What does Playoff Format control?",
    answer: "Format controls playoff length, field size, qualification, and byes. League Weaver can recommend a structure based on team count and season length.",
    tags: ["playoff format", "field size", "qualification", "byes", "recommended playoffs"],
  },
  {
    category: "Wizard",
    question: "What do Playoff Rules control?",
    answer: "Playoff Rules control reseeding, championship venue, draft order method, seed labels, and consolation bracket behavior.",
    tags: ["playoff rules", "reseeding", "championship venue", "draft order", "seed labels", "consolation"],
  },
  {
    category: "Wizard",
    question: "What do Playoff Brand and Logos control?",
    answer: "Brand and Logos let commissioners name the playoff, choose its theme, upload playoff identity art, and add custom round or game logos for championship and consolation brackets.",
    tags: ["playoff brand", "playoff logos", "round logos", "game logos", "theme"],
  },
  {
    category: "Wizard",
    question: "Step 6: What is Review & Generate for?",
    answer: "Review & Generate is the final checkpoint. It summarizes the setup so you can catch missing names, unbalanced divisions, playoff issues, or wrong assumptions before creating the season.",
    tags: ["step 6", "review generate", "final checkpoint", "validation", "generate season"],
  },
  {
    category: "Using",
    question: "How do I make a fantasy football schedule?",
    answer: "Open the builder, add or import your teams, confirm divisions and season settings, choose fairness rules, review the setup, then generate the schedule. League Weaver creates the full season in seconds.",
    tags: ["builder", "generate schedule", "teams", "divisions", "fairness rules"],
  },
  {
    category: "Using",
    question: "Do I need an account to start?",
    answer: "No. You can start building without an account. Signing in helps you save schedules, reopen seasons, keep saved leagues, and manage work across devices.",
    tags: ["account", "sign in", "save schedules", "free"],
  },
  {
    category: "Using",
    question: "Should I use quick create or customize everything?",
    answer: "Use quick create when the league basics are already right and you want recommended settings fast. Use customize everything when you want to review each structure, season, and playoff choice.",
    tags: ["quick create", "customize everything", "recommended settings", "builder"],
  },
  {
    category: "Using",
    question: "When should I save a league?",
    answer: "Save a league after team names, divisions, logos, and colors are correct. That gives you a reusable starting point for future schedules.",
    tags: ["save league", "saved league", "reuse", "future seasons"],
  },
  {
    category: "Platforms",
    question: "How do ESPN and Sleeper imports work?",
    answer: "Imports help fill in your league setup faster. League Weaver can pull public league structure from Sleeper or ESPN when available, then lets you review teams before generating the schedule.",
    tags: ["espn import", "sleeper import", "league id", "teams", "review"],
  },
  {
    category: "Platforms",
    question: "Can League Weaver write the generated schedule back to ESPN or Sleeper?",
    answer: "Not in the MVP release. You can export and share the schedule, then use it as the source of truth when updating your official platform.",
    tags: ["espn", "sleeper", "export", "mvp", "schedule sync"],
  },
  {
    category: "Pages",
    question: "What is the builder page for?",
    answer: "The builder is where you create or import a league, tune the format, set fairness rules, preview playoff shape, and generate the season schedule.",
    tags: ["build page", "builder", "league setup", "playoffs"],
  },
  {
    category: "Pages",
    question: "What are My Schedules and Saved Leagues for?",
    answer: "My Schedules is where generated seasons live. Saved Leagues stores reusable league setups, so returning commissioners can start next season faster without rebuilding every team from scratch.",
    tags: ["my schedules", "saved leagues", "reuse league", "season"],
  },
  {
    category: "Pages",
    question: "What happens inside a season workspace?",
    answer: "A season workspace shows weekly matchups, team schedules, standings, playoff views, share settings, score entry, and exports. It is the commissioner desk for the generated season.",
    tags: ["season workspace", "standings", "team schedule", "scores", "playoffs"],
  },
  {
    category: "Pages",
    question: "What is on the home page?",
    answer: "The home page introduces League Weaver, explains the NFL-style schedule idea, shows the season preview, and points commissioners toward the builder or saved schedules.",
    tags: ["home page", "welcome", "season preview", "start building"],
  },
  {
    category: "Pages",
    question: "What is the FAQ page for?",
    answer: "The FAQ page is the help center. Use search and filters to learn basics, schedule structure, special features, wizard steps, platform imports, pages, sharing, and exports.",
    tags: ["faq", "help center", "search", "filters"],
  },
  {
    category: "Pages",
    question: "What is the Pricing page for?",
    answer: "Pricing explains current MVP access and what is included now, such as schedule generation, saved schedules, score entry, standings, exports, and public sharing.",
    tags: ["pricing", "mvp access", "free", "included"],
  },
  {
    category: "Pages",
    question: "What is My Schedules for?",
    answer: "My Schedules lists generated seasons. You can search, filter all/cloud/guest schedules, open a workspace, share, copy, delete, or open a print preview.",
    tags: ["my schedules", "cloud schedules", "guest schedules", "search", "filter", "print preview"],
  },
  {
    category: "Pages",
    question: "What is Saved Leagues for?",
    answer: "Saved Leagues lists reusable league setups. You can search, filter by league size, use a league for a new schedule, edit it, copy it, or delete it.",
    tags: ["saved leagues", "reuse", "edit league", "copy league", "delete league", "league size"],
  },
  {
    category: "Pages",
    question: "What is the Account page for?",
    answer: "The Account page handles sign-in and account settings. Signed-in users can manage Account, Profile, Password, and Delete tabs.",
    tags: ["account page", "sign in", "account settings", "profile", "password", "delete"],
  },
  {
    category: "Pages",
    question: "What does the Account tab show?",
    answer: "The Account tab focuses on saved account season access, schedule management, and account-level messages. It is the main signed-in dashboard area.",
    tags: ["account tab", "saved seasons", "dashboard", "signed in"],
  },
  {
    category: "Pages",
    question: "What does the Profile tab do?",
    answer: "The Profile tab lets a user update public-facing account details such as display identity or profile details used by League Weaver.",
    tags: ["profile tab", "display name", "profile", "identity"],
  },
  {
    category: "Pages",
    question: "What does the Password tab do?",
    answer: "The Password tab lets a signed-in user update their password from inside account settings.",
    tags: ["password tab", "change password", "account settings"],
  },
  {
    category: "Pages",
    question: "What does the Delete tab do?",
    answer: "The Delete tab contains destructive account actions, including deleting saved leagues or deleting the account when confirmed.",
    tags: ["delete tab", "delete account", "delete saved leagues", "danger"],
  },
  {
    category: "Pages",
    question: "What is This Week in the season workspace?",
    answer: "This Week is the current weekly dashboard. It helps commissioners focus on the active slate, scores, and the games that need attention right now.",
    tags: ["this week", "weekly dashboard", "active slate", "scores"],
  },
  {
    category: "Pages",
    question: "What is League Schedule in the season workspace?",
    answer: "League Schedule shows the full league slate by week. Use it to inspect matchups, byes, venues, special labels, and the complete regular-season path.",
    tags: ["league schedule", "full schedule", "weeks", "byes", "venues", "matchups"],
  },
  {
    category: "Pages",
    question: "What is Team Schedule in the season workspace?",
    answer: "Team Schedule lets you focus on one team's season path, including opponents, home and away balance, byes, results, ratings, and details.",
    tags: ["team schedule", "opponents", "home away", "byes", "results"],
  },
  {
    category: "Pages",
    question: "What is Copy Sheet in the season workspace?",
    answer: "Copy Sheet formats the schedule for commissioner handoff. It is useful when copying games into ESPN, Sleeper, a document, a spreadsheet, or a league message.",
    tags: ["copy sheet", "prints", "espn", "sleeper", "handoff", "spreadsheet"],
  },
  {
    category: "Pages",
    question: "What is Game of the Week in the season workspace?",
    answer: "Game of the Week highlights the strongest weekly matchups so the commissioner can promote the best game, write a league note, or create weekly hype.",
    tags: ["game of the week", "gotw", "weekly hype", "best matchup"],
  },
  {
    category: "Pages",
    question: "What is Matchup Ratings in the season workspace?",
    answer: "Matchup Ratings helps compare the strength or interest level of games. It makes marquee matchups and weaker slates easier to spot.",
    tags: ["matchup ratings", "ratings", "marquee matchups", "quality"],
  },
  {
    category: "Pages",
    question: "What is Standings in the season workspace?",
    answer: "Standings tracks league records, division context, and season movement after scores are entered. It helps commissioners explain playoff races and weekly stakes.",
    tags: ["standings", "records", "division standings", "playoff races", "weekly stakes"],
  },
  {
    category: "Pages",
    question: "What is Playoffs in the season workspace?",
    answer: "Playoffs shows the playoff picture and bracket context from the configured format. It helps commissioners understand qualification, seeds, consolation paths, and postseason outcomes.",
    tags: ["playoffs", "playoff picture", "bracket", "seeds", "consolation"],
  },
  {
    category: "Pages",
    question: "What is Share in the season workspace?",
    answer: "Share is where a commissioner publishes, copies, updates, or turns off the public schedule link and controls which public details are visible.",
    tags: ["share page", "publish", "copy link", "public display", "privacy"],
  },
  {
    category: "Pages",
    question: "What is Settings in the season workspace?",
    answer: "Settings contains season-level tools and controls. Use it for commissioner maintenance after generation, including workspace actions that do not belong inside the schedule table itself.",
    tags: ["settings", "season settings", "workspace tools", "maintenance"],
  },
  {
    category: "Pages",
    question: "What is the public schedule page?",
    answer: "The public schedule page is the league-facing version of a published season. It shows the schedule in a cleaner public view for managers and guests.",
    tags: ["public schedule", "published schedule", "share link", "managers"],
  },
  {
    category: "Pages",
    question: "What is the public team schedule page?",
    answer: "The public team schedule page focuses on one team's published schedule, making it easier for a manager to check only their own path through the season.",
    tags: ["public team schedule", "team page", "manager", "published schedule"],
  },
  {
    category: "Pages",
    question: "What are the Privacy and Terms pages for?",
    answer: "Privacy explains what League Weaver collects and how imports, account data, emails, ads, and choices work. Terms explain service rules, league content responsibility, and MVP access terms.",
    tags: ["privacy", "terms", "legal", "imports", "account data"],
  },
  {
    category: "Pages",
    question: "What is the unsubscribe page for?",
    answer: "The unsubscribe page lets someone opt out of schedule emails or notifications tied to a public schedule email flow.",
    tags: ["unsubscribe", "email", "notifications", "public schedule"],
  },
  {
    category: "Sharing",
    question: "Can I share a schedule with my league?",
    answer: "Yes. You can publish a public share page and control what details are shown, including manager names, city names, and venues when those privacy options are available.",
    tags: ["public share", "privacy", "manager names", "venues", "city names"],
  },
  {
    category: "Sharing",
    question: "Can I export my schedule?",
    answer: "Yes. League Weaver supports clean exports such as CSV and PDF where available, so commissioners can send the schedule to managers or keep a league record.",
    tags: ["csv", "pdf", "export", "download"],
  },
];

const highlights = [
  { icon: Compass, label: "Learn the product", text: "Clear answers for first-time commissioners." },
  { icon: Trophy, label: "Build better seasons", text: "Guidance around structure, fairness, and marquee weeks." },
  { icon: LayoutDashboard, label: "Find the right page", text: "Know where schedules, leagues, scores, and exports live." },
];

function normalized(value: string) {
  return value.trim().toLowerCase();
}

export function FaqExplorer() {
  const [activeCategory, setActiveCategory] = useState<FaqCategory>("All");
  const [query, setQuery] = useState("");
  const cleanQuery = normalized(query);

  const visibleFaqs = useMemo(() => {
    return faqs.filter((item) => {
      const categoryMatch = activeCategory === "All" || item.category === activeCategory;
      const haystack = normalized([item.category, item.question, item.answer, ...item.tags].join(" "));
      return categoryMatch && (!cleanQuery || haystack.includes(cleanQuery));
    });
  }, [activeCategory, cleanQuery]);

  return (
    <section className="faq-shell page-width" aria-label="League Weaver FAQ search and categories">
      <div className="faq-highlights" aria-label="FAQ highlights">
        {highlights.map(({ icon: Icon, label, text }) => (
          <article key={label}>
            <Icon aria-hidden="true" />
            <span>
              <strong>{label}</strong>
              <small>{text}</small>
            </span>
          </article>
        ))}
      </div>

      <div className="faq-tools">
        <label className="faq-search">
          <Search aria-hidden="true" />
          <span className="sr-only">Search FAQ</span>
          <input value={query} type="search" placeholder="Search wizard steps, ESPN, playoffs, Copy Sheet..." onChange={(event) => setQuery(event.target.value)} />
        </label>
        <div className="faq-category-tabs" aria-label="FAQ categories">
          {categories.map((category) => (
            <button
              key={category.label}
              type="button"
              className={activeCategory === category.label ? "active" : ""}
              aria-pressed={activeCategory === category.label}
              onClick={() => setActiveCategory(category.label)}
            >
              <strong>{category.label}</strong>
              <small>{category.hint}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="faq-results-head">
        <span>
          <HelpCircle aria-hidden="true" />
          <strong>{visibleFaqs.length} answer{visibleFaqs.length === 1 ? "" : "s"}</strong>
        </span>
        <small>{activeCategory === "All" ? "All categories" : `${activeCategory} questions`}</small>
      </div>

      {visibleFaqs.length > 0 ? (
        <div className="faq-list">
          {visibleFaqs.map((item) => (
            <article className="faq-card" key={item.question}>
              <span className="faq-card-kicker">{categoryIcon(item.category)}{item.category}</span>
              <h2>{item.question}</h2>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="faq-empty">
          <HelpCircle aria-hidden="true" />
          <strong>No matching answers yet.</strong>
          <p>Try a simpler search like ESPN, Sleeper, playoffs, Copy Sheet, standings, share, export, or builder.</p>
        </div>
      )}
    </section>
  );
}

function categoryIcon(category: FaqItem["category"]) {
  const iconProps = { "aria-hidden": true };
  switch (category) {
    case "What": return <ShieldCheck {...iconProps} />;
    case "Why": return <Trophy {...iconProps} />;
    case "Structure": return <CalendarDays {...iconProps} />;
    case "Features": return <Compass {...iconProps} />;
    case "Wizard": return <LayoutDashboard {...iconProps} />;
    case "Using": return <CalendarDays {...iconProps} />;
    case "Platforms": return <Users {...iconProps} />;
    case "Pages": return <LayoutDashboard {...iconProps} />;
    case "Sharing": return <Share2 {...iconProps} />;
  }
}
