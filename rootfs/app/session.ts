export const SCROLLBACK_LIMIT = 500 * 1024; // 500 KB

export type Session = {
  // Typed loosely — Bun.Subprocess with terminal option; exact types vary by Bun version
  proc: any;
  clients: Set<any>; // Set<ServerWebSocket> — avoid circular import with server.ts
  name: string;
  scrollback: string;
};

export const sessions = new Map<string, Session>();

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
  // Bun.spawn terminal API (v1.3.5+):
  //   terminal: { cols, rows, data(terminal, chunk) } — I/O via proc.terminal.write() / data callback
  //   proc.stdin / proc.stdout are null when terminal is set
  //   proc.terminal.resize(cols, rows) for resize
  // `as any` guards against incomplete TypeScript typedefs in some Bun versions
  const proc = Bun.spawn(["bash", "--login"], {
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
      CLAUDE_CONFIG_DIR: "/homeassistant/.claudecode",
      TERM: "xterm-256color",
    },
  } as any);

  session.proc = proc;

  proc.exited.then(() => {
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
  try {
    session.proc?.kill();
  } catch {}
  sessions.delete(name);
  broadcastSessionList();
}
