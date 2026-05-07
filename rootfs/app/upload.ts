import { randomBytes } from "crypto";
import path from "path";

export const DEFAULT_UPLOAD_DIR = "/tmp/claude-paste";

export async function handleUpload(req: Request, uploadDir = DEFAULT_UPLOAD_DIR): Promise<Response> {
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

  const rawExt = file.name.split(".").pop() || "png";
  const ext = rawExt.replace(/[^a-z0-9]/gi, "").toLowerCase() || "png";
  const filename = `${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  const filePath = path.join(uploadDir, filename);

  await Bun.write(filePath, file);

  return new Response(JSON.stringify({ path: filePath }), {
    headers: { "Content-Type": "application/json" },
  });
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
