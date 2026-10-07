@AGENTS.md

# Claude Code in math-viz

AGENTS.md above holds the project conventions and is shared with the PI agents that also work here. This file adds what differs under Claude Code and how designs from figma0 reach the code. Durable project facts (conventions, gotchas, commands) go into AGENTS.md, as its Self-Improvement section says; facts that only matter under Claude Code go here.

## Harness differences

| AGENTS.md says | Under Claude Code |
|---|---|
| skills in `.pi/skills/` | `style-match` and `tslsp` are linked into `.claude/skills/` and load as skills. `code-review` is not linked, because it would shadow Claude Code's built-in skill of that name: read `.pi/skills/code-review/SKILL.md` as a file when reviewing |
| `pi-lsp-client` diagnostics | not available; use `tslsp` and `npm run typecheck` |
| `read` on a screenshot | the Read tool shows you the PNG |
| escapes in source | Write and Edit decode `\u00a0` in their content to the character itself, so an escape meant for the file lands as an invisible no-break space: write such strings through a script (`\\u00a0` in Python) and check with `grep -rlP '\x{00a0}' src` |

## Session

`launch-env-cc.sh` starts tmux session `math-viz-cc-<branch>` with windows editor, shell, repl, server and agent, all in the checkout. The server window runs your two vite servers, both serving this worktree, on ports from 5180 up: `server.1` with live-edit relay (`$MATHVIZ_WTR_PORT`) and `server.2` disk-only (`$MATHVIZ_DISK_PORT`). Screenshot and test against `$MATHVIZ_DISK_PORT` only, because your edits land on disk and live-edit buffers stay on the other one. The user's own servers run their checkout on 5173 and 5174: they show the user's code, not yours, so never point a check at them and never stop them.

The session owns its long-running services (both vites; the Figma bridge daemon runs in the shared `figma-bridge` session) and restarts each on its own if it exits; claude0 keeps them that way. Don't start servers or daemons yourself, in the background or in another window: a stray one holds a port, outlives your session and gets mistaken for yours. If a service stays down, say so in the progress file and your next message, and carry on with work that doesn't need it.

## Implementing figma0's designs

figma0 is the Claude agent that designs math-viz in Figma. It owns the design and the Figma file; you own the code. You read its work and never edit it: not the Figma file, not anything under figma0's directory, because figma0 runs its own long builds there and treats its boards as frozen records.

| What | Where |
|---|---|
| figma0's directory | `/opt/dev/agent/code/agents/claude/figma0/` (`$FIGMA0` below) |
| Design briefs, decisions, recipes | `$FIGMA0/knowledge/` (`handoff.md` first, then the brief and recipe it names) |
| Board exports (PNG) | `$FIGMA0/exports/<area>/`; node ids of the boards in `rec-ids.json` |
| Token payloads | `$FIGMA0/scripts/mathviz-claude/payloads/*.json`: proposed tokens with per-theme values |
| Figma file | MathViz-claude, key `yj7gdCaBuQw4X2806iUHRc` |

Start from the exports and payloads. For exact values (spacing, size, radius, text styling, which token a fill binds to), read the snapshots in `$FIGMA0/exports/snapshots/`: JSON dumps of whole boards with every node's absolute box, auto-layout, paints with token names, text and component props (`index.json` lists them; `jq` them, they are large). They need no Figma and any number of agents can read them at once. Only when a value is missing from them, read the live file through the bridge:

```bash
M=$FIGMA0/scripts/mathviz-claude/mv.js
node $M health                                    # "connected":true means the user's plugin is running
node $M exec .local/figma/<probe>.js              # async Plugin-API body ending in `return <json>`
node $M export <nodeId> .local/figma/<name>.png --scale 2
```

Probes only read: no property sets, no `create*`, no `remove()`, because a stray write lands in the user's design file and in figma0's frozen boards. Keep probes in `.local/figma/`. The daemon runs in tmux session `figma-bridge`; if `mv.js` reports it unreachable, run `$FIGMA0/scripts/mathviz-claude/bridge-session.sh`, which starts it there and does nothing when it already runs. To refresh or add a snapshot: `$FIGMA0/scripts/mathviz-claude/snapshot.sh <nodeId> <name>`. If `health` stays disconnected, the plugin isn't running, so ask the user once and carry on from exports meanwhile. A timed-out exec keeps running inside Figma, so wait for it to finish before sending the next one.

The design is the spec for layout, hierarchy, copy, interaction and motion. Change the shared components (`src/components/`) and themes as far as the design needs; other views that use them must keep working, which `npm test` and a look at their pages confirm. Code values stay the source of truth for tokens: a design colour maps to the theme variable it is bound to, never a literal, so all six themes keep working. A proposed token goes into all six theme files under `src/style/themes/`. When the design and the running code disagree on behaviour the design doesn't show, keep the code's behaviour and note it. When the design is ambiguous or can't be built as drawn (a glyph the shipped fonts lack, an interaction the board only implies), pick the reading closest to its Specs and Decisions boards, record the call in the task's progress file, and keep going.

Done means the running app matches the board: screenshot the same state in Playwright at the board's viewport and compare it with the export, in more than one theme, alongside `npm test`.

## Long runs

Design implementation runs for hours across sessions and often overnight with nobody watching. Work it with the `long-run` skill: its brief, plan and progress files live in `.local/briefs/`; read all three at the start of every session and after a compaction. Commit on your branch at each verified step (`npm test && git commit`, never `;`). Work only in this worktree: the user's checkout at `/opt/dev/agent/src/math-viz` is theirs, and merging into main is their call.

A sweep that fans out to subagents (one per state and theme) meets Claude Code's cap of 20 running at once: launch the rest as the first finish. Give them one brief file to read (references, how to judge, the known differences, the findings format) and the captures made beforehand, so each starts measuring at once; M13's is `.local/shots/M13/sweep/AGENT-BRIEF.md`.

A standing instruction from the user about how your turns end. A message with no tool call in it ends your turn, and the work stops there until you are asked to continue. The user has seen agents end turns in four ways while work they asked for was still owed, and does not want any of them:
1. A long summary of what was done that closes by announcing the next step and has no tool call, so the next thing never starts.
2. An offer to carry on with something unless the user would prefer otherwise, which stops to wait for an answer the user was not going to give.
3. A list of decisions for the user when, by your own account, none of them blocks the rest of the work.
4. Deciding that this is a good place to report, because the turn has been long or a milestone is done.

Status notes are welcome, and so are your recommendations on open decisions, but put them in the same message as your next tool call and carry on with whatever does not depend on the user's answer. The stops the user does want are the ones where nothing can move without them, or where the thing blocking you is deliberately protected from you. This does not override the need for confirmation on risky or destructive actions.
