import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo/mode";
import { demoIsDemoMediaFile, demoMediaMime } from "@/lib/demo/mutations";
import { DEMO_MEDIA_DIR } from "@/lib/demo/store";

const FILE_PATTERN = /^[0-9a-f-]{36}\.(jpg|png|webp|gif)$/;

/** Serves images uploaded in demo mode from .data/media. Disabled once Supabase is configured. */
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!isDemoMode() || !FILE_PATTERN.test(file) || !demoIsDemoMediaFile(file)) {
    return new NextResponse("Not found", { status: 404 });
  }
  try {
    const bytes = await readFile(path.join(DEMO_MEDIA_DIR, file));
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": demoMediaMime(file) ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
