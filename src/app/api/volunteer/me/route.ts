import { type NextRequest, NextResponse } from "next/server";

import { COOKIE_NAME, verifyVolunteerToken } from "@/lib/volunteer/session";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ session: null });
  }
  const session = verifyVolunteerToken(token);
  return NextResponse.json({ session });
}
