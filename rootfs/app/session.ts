export const SCROLLBACK_LIMIT = 500 * 1024; // 500 KB

export type Session = {
  // Typed loosely — Bun.Subprocess with terminal option; exact types vary by Bun version
  proc: any;
  clients: Set<any>; // Set<ServerWebSocket> — avoid circular import with server.ts
  name: string;
  tmuxName: string;
  scrollback: string;
};

export const sessions = new Map<string, Session>();

// tmux session names only allow [a-zA-Z0-9_\-.]
function toTmuxName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-.]/g, "_") || "session";
}

export function appendScrollback(session: Pick<Session, "scrollback">, data: string): void {
  session.scrollback += data;
  if (session.scrollback.length > SCROLLBACK_LIMIT) {
    session.scrollback = session.scrollback.slice(session.scrollback.length - SCROLLBACK_LIMIT);
  }
}

export function broadcastSessionList(): void {
  const msg = JSON.stringify({ type: "session_list", sessions: [...sessions.keys()] });
  for (const session of sessions.values()) {
    for (const ws of session.clients) {
      ws.send(msg);
    }
  }
}

function spawnPty(session: Session): void {
  // tmux new-session -A: attach if session already exists, create otherwise.
  // This is the key flag that makes sessions survive add-on restarts —
  // Bun respawns the tmux client, which reattaches to the still-running session.
  const proc = Bun.spawn(
    [
      "tmux", "new-session", "-A",
      "-s", session.tmuxName,
      "-x", "220",
      "-y", "50",
      "-e", `CLAUDE_SESSION_NAME=${session.name}`,
      "-e", `CLAUDE_CONFIG_DIR=/data/.claudecode`,
      "bash", "--login",
    ],
    {
      cwd: "/homeassistant",
      terminal: {
        cols: 220,
        rows: 50,
        data(_terminal: unknown, chunk: Buffer) {
          const data = chunk.toString();
          appendScrollback(session, data);
          const msg = JSON.stringify({ type: "output", data });
          for (const ws of session.clients) {
            ws.send(msg);
          }
        },
      },
      env: {
        ...process.env,
        CLAUDE_CONFIG_DIR: "/data/.claudecode",
        TERM: "xterm-256color",
        CLAUDE_SESSION_NAME: session.name,
      },
    } as any
  );

  session.proc = proc;

  proc.exited.then(() => {
    // Skip if session was explicitly closed — clients have already moved on
    if (!sessions.has(session.name)) return;
    const deadMsg = JSON.stringify({
      type: "output",
      data: "\r\n\x1b[33mSession ended — press Enter to restart\x1b[0m\r\n",
    });
    for (const ws of session.clients) {
      ws.send(deadMsg);
    }
    broadcastSessionList();
  });
}

export function createSession(name: string): Session {
  const session: Session = {
    proc: null,
    clients: new Set(),
    name,
    tmuxName: toTmuxName(name),
    scrollback: "",
  };
  sessions.set(name, session);
  spawnPty(session);
  broadcastSessionList();
  return session;
}

export function restartSessionProc(session: Session): void {
  spawnPty(session);
}

export function closeSession(name: string): void {
  const session = sessions.get(name);
  if (!session) return;
  // Kill the tmux session — terminates all processes inside it
  Bun.spawnSync(["tmux", "kill-session", "-t", session.tmuxName]);
  // Also SIGTERM the client process in case tmux kill-session is slow
  const pid = session.proc?.pid;
  if (pid) {
    try { process.kill(-pid, "SIGTERM"); } catch {}
  }
  sessions.delete(name);
  broadcastSessionList();
}
