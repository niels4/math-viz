#!/usr/bin/env zsh

# Always run from the directory containing this script, so the tmux session
# opens in the project root no matter where the script is invoked from.
cd "${0:A:h}"

detach=0
for arg in "$@"; do
  case "$arg" in
    --detach) detach=1 ;;
  esac
done

session="math-viz-$(git branch --show-current)"

if tmux has-session -t "$session" 2>/dev/null; then
  if [[ $detach -eq 1 ]]; then
    echo "session ${session} already exists (leaving detached)"
    exit 0
  fi
  echo "reattaching to ${session}"
  tmux attach -t $session
  exit 0
fi

# Pick a free port for the vite dev server. The user's own session often
# holds 5173 and several agent sessions may run simultaneously — never
# assume a port, probe for a free one.
port=5173
while lsof -nP -iTCP:$port -sTCP:LISTEN >/dev/null 2>&1; do
  (( port += 1 ))
done

# Next free port above $port for the second (disk-only) server.
port2=$(( port + 1 ))
while lsof -nP -iTCP:$port2 -sTCP:LISTEN >/dev/null 2>&1; do
  (( port2 += 1 ))
done

echo "starting ${session} (wtr port ${port}, disk port ${port2})"

tmux new-session -d -s $session -n "editor"
tmux new-window -t $session -n "shell"
tmux new-window -t $session -n "repl"
tmux new-window -t $session -n "server"
# Split the server window: server.1 runs with WTR (live edits),
# server.2 runs disk-only (DISABLE_WTR=1).
tmux split-window -t "${session}:server.1"
tmux new-window -t $session -n "agent"

editor="${session}:editor.1"
server1="${session}:server.1"
server2="${session}:server.2"
agent="${session}:agent.1"

tmux send-keys -t $editor "nvim" C-m
# -a: auto-trust — worktree paths change per branch and would each prompt
tmux send-keys -t $agent "pi -a" C-m

# Open the pages dir in the editor for convenience (new viz pages go here)
tmux send-keys -t $editor ":e src/pages/" C-m

tmux send-keys -t $server1 "npm i && npm run dev -- --port $port --strictPort" C-m

# DISABLE_WTR=1: disk-only server. The user's live-edit loop
# (websocket-text-relay, unsaved buffers) runs on the WTR server port;
# the disk-only server must only see disk edits, so the two never collide.
tmux send-keys -t $server2 "npm i && DISABLE_WTR=1 npm run dev -- --port $port2 --strictPort" C-m

tmux select-window -t "${session}:1"
if [[ $detach -eq 1 ]]; then
  echo "detached; agent pane: ${agent}; wtr server: http://localhost:${port}; disk server: http://localhost:${port2}"
else
  tmux attach-session -t $session
fi
