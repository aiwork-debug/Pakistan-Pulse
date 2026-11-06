import { NextResponse, type NextRequest } from "next/server";

/** /categories/<slug> shows the same listing as News, filtered by that category. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const target = new URL("/news", request.url);
  if (/^[a-z0-9-]{1,60}$/.test(slug)) target.searchParams.set("category", slug);
  return NextResponse.redirect(target, 308);
}
