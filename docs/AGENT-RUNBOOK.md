# Autonomous Build Agent — Runbook

How the player-data + awards backlog gets built without you watching. Repo: `cdforge/leagueweaver-v3`.

## How it works
1. You label an issue **`agent:build`**.
2. `.github/workflows/agent-build.yml` fires:
   - **Dependency gate** — reads `blocked by:#NN` lines in the issue body; if any blocker is still open it
     comments, removes the label, and stops. (Label-gated queue.)
   - **Build** — checks out `feat/player-data-awards`, runs `claude-code-action@v1` on **Sonnet**
     (`agent:opus` label escalates to Opus), implements to the issue's Insertion points, self-runs
     `typecheck + build + test`, and opens a PR (`Closes #NN`) into `feat/player-data-awards`.
   - **Auto-merge** — enables `--auto --squash`; GitHub merges **only when the required `ci` check is green**.
3. `.github/workflows/ci.yml` runs typecheck + lint + build + `npm test` (+ `test:ui` screenshot for UI
   issues) on the PR. Red = no merge; the PR sits open for a human.

**Definition of done = CI, not the agent.** TEST-0 encodes the golden numbers (288.42, 55.50,
26.00=8+16+0+2) so award correctness is objective. UI issues add a Playwright smoke → "green" means the page
renders + a screenshot artifact exists.

## One-time owner setup (only you can do these)
1. **Install the Claude GitHub App** on `cdforge/leagueweaver-v3` — https://github.com/apps/claude
   (or `/install-github-app` in the Claude Code CLI).
2. **Add the secret** `ANTHROPIC_API_KEY` — repo → Settings → Secrets and variables → Actions.
3. **Create the integration branch**: `git switch -c feat/player-data-awards && git push -u origin HEAD`.
4. **Branch protection** on `feat/player-data-awards` → require the **`ci`** status check to pass before
   merge (Settings → Branches). This is what makes auto-merge safe.
5. **Create labels**: `agent:build`, `agent:opus`, `phase:P0…P6`, `type:data|engine|ui|cross`,
   `area:player-data|awards|conference|game-detail`, `ready`, and milestone `Player Data + Awards v1`.
6. **Verify** `anthropics/claude-code-action@v1` input names against its current README (they can change);
   adjust `agent-build.yml` if needed.

## Running the backlog
- Kick off only **dependency-ready** issues (TEST-0 first, then CONF-1 / DATA-1). Label them `agent:build`.
- The queue self-serializes: labeling a blocked issue is a no-op until its blocker merges (which closes it,
  unblocking the next). You can safely pre-label a batch.
- **Escalate**: add `agent:opus` to a hard issue before `agent:build`.
- **Kill switch**: remove `agent:build` / disable the `Agent Build` workflow in the Actions tab.
- **When CI is red**: the PR stays open with the failing check + the agent's comment; fix by hand or
  re-label to let the agent retry.

## Guardrails baked into the agent prompt
Smallest change to pass acceptance · no fake data · no PVE hardcoding · public ESPN/Sleeper only ·
platform-scored points only · never weaken/skip tests · must pass typecheck+build+test before the PR.

## Costs
Sonnet by default (issues are tightly specified + test-gated). Opus only on `agent:opus`. `--max-turns 40`
caps a runaway issue.

## Status: NOT LIVE
The workflow files + `typecheck` script are written but inert. Nothing runs, no issues exist, nothing is
committed until you (a) approve the issues draft, (b) do the owner setup above, and (c) commit these files.
