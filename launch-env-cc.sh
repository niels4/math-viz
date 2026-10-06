#!/usr/bin/env zsh

# launch-env-cc.sh: math-viz with a Claude Code agent. Same layout as
# launch-env.sh (which runs pi), with its own session prefix so neither
# launcher reattaches the other's session.
# Usage: launch-env-cc.sh [--detach]   (session math-viz-cc-<branch>)

# Always run from the directory containing this script, so the tmux session
# opens in this checkout no matter where the script is invoked from.
cd "${0:A:h}"
checkout="$PWD"

detach=0
for arg in "$@"; do
  case "$arg" in
    --detach) detach=1 ;;
  esac
done

session="math-viz-cc-$(git branch --show-current)"

# "=" forces an exact match; a bare name prefix-matches other sessions.
if tmux has-session -t "=$session" 2>/dev/null; then
  if [[ $detach -eq 1 ]]; then
    echo "session ${session} already exists (leaving detached)"
    exit 0
  fi
  echo "reattaching to ${session}"
  tmux attach -t "=$session"
  exit 0
fi

# Pick free ports from 5180 up: the user's own servers live on 5173-5174
# and must never be taken or confused with the agent's, and other agent
# sessions run at the same time, so never assume a port.
port=5180
while lsof -nP -iTCP:$port -sTCP:LISTEN >/dev/null 2>&1; do
  (( port += 1 ))
done
port2=$(( port + 1 ))
while lsof -nP -iTCP:$port2 -sTCP:LISTEN >/dev/null 2>&1; do
  (( port2 += 1 ))
done

echo "starting ${session} (wtr port ${port}, disk port ${port2})"

tmux new-session -d -s "$session" -n "editor" -c "$checkout"
tmux new-window -t "=$session" -n "shell" -c "$checkout"
tmux new-window -t "=$session" -n "repl" -c "$checkout"
tmux new-window -t "=$session" -n "server" -c "$checkout"
tmux split-window -t "=${session}:=server.1" -c "$checkout"
tmux new-window -t "=$session" -n "agent" -c "$checkout"

editor="=${session}:=editor.1"
server1="=${session}:=server.1"
server2="=${session}:=server.2"
agent="=${session}:=agent.1"

tmux send-keys -t "$editor" "nvim" C-m
tmux send-keys -t "$editor" ":e src/pages/" C-m

# Long-running services belong to the session, not the agent: each runs in
# its own window inside a restart loop, so a crash brings it back without
# anyone attending. Ctrl-C in the window stops the loop for good.
keep() { echo "while true; do $1; echo '[exited; restarting in 3s]'; sleep 3; done"; }

# One npm install, then both servers: two concurrent installs in one
# checkout race. tmux remembers the signal if it comes before the wait.
deps="${session}-deps"
tmux send-keys -t "$server1" "npm i; tmux wait-for -S $deps; $(keep "npm run dev -- --port $port --strictPort")" C-m
# DISABLE_WTR=1: disk-only server, so agent edits never collide with the
# user's unsaved live-edit buffers on the other port.
tmux send-keys -t "$server2" "tmux wait-for $deps; $(keep "DISABLE_WTR=1 npm run dev -- --port $port2 --strictPort")" C-m

# The Figma bridge daemon is shared by every agent, so it lives in its own
# tmux session (figma-bridge), not this one; this only makes sure it runs.
figma0="/opt/dev/agent/code/agents/claude/figma0"
"$figma0/scripts/mathviz-claude/bridge-session.sh"

# Permission bypass is deliberate: agents run as the unprivileged `agent` OS
# user, so OS file permissions are the security boundary.
# --effort max: the user's choice for the first full-design runs (2026-10-06).
# A new worktree shows Claude Code's trust dialog once; answer it in the pane.
# Exported in the pane's shell, so a driver that restarts Claude there keeps them.
tmux send-keys -t "$agent" "export MATHVIZ_WTR_PORT=$port MATHVIZ_DISK_PORT=$port2 FIGMA0=$figma0" C-m
tmux send-keys -t "$agent" "claude --dangerously-skip-permissions --effort max" C-m

tmux select-window -t "$agent"
if [[ $detach -eq 1 ]]; then
  echo "detached; agent pane: ${session}:agent.1; wtr server: http://localhost:${port}; disk server: http://localhost:${port2}"
else
  tmux attach-session -t "=$session"
fi
