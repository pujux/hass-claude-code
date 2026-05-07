import path from "path";

export const DEFAULT_UPLOAD_BASE = "/tmp/claude-paste";

function sanitizeSession(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_") || "default";
}

async function nextImageNumber(sessionDir: string): Promise<number> {
  const counterPath = path.join(sessionDir, ".next");
  let n = 1;
  try {
    const text = await Bun.file(counterPath).text();
    n = parseInt(text.trim(), 10) || 1;
  } catch {
    // counter file missing — start at 1
  }
  await Bun.write(counterPath, String(n + 1));
  return n;
}

export async function handleUpload(req: Request, uploadBase = DEFAULT_UPLOAD_BASE): Promise<Response> {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return jsonError("Expected multipart/form-data", 400);
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return jsonError("Failed to parse multipart body", 400);
  }

  let file: File | null = null;
  for (const value of formData.values()) {
    if (value instanceof File) {
      file = value;
      break;
    }
  }
  if (!file) {
    return jsonError("No file field found in form data", 400);
  }

  const sessionRaw = formData.get("session");
  const session = sanitizeSession(typeof sessionRaw === "string" ? sessionRaw : "default");
  const sessionDir = path.join(uploadBase, session);
  await Bun.write(path.join(sessionDir, ".keep"), ""); // ensures dir exists

  const rawExt = file.name.split(".").pop() || "png";
  const ext = rawExt.replace(/[^a-z0-9]/gi, "").toLowerCase() || "png";
  const n = await nextImageNumber(sessionDir);
  const filename = `image_${n}.${ext}`;
  const filePath = path.join(sessionDir, filename);

  await Bun.write(filePath, file);

  return new Response(JSON.stringify({ path: filePath, n }), {
    headers: { "Content-Type": "application/json" },
  });
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
