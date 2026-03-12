import { NextResponse } from "next/server";

import {
  getRankedOrganizations,
  type SupportCategoryId,
} from "@/lib/organizations/ranking";

const VALID_CATEGORIES: SupportCategoryId[] = [
  "prison-leavers",
  "residential-rehab-graduates",
  "mental-health-discharge",
  "homelessness-support",
  "new-to-recovery",
];

export async function GET(
  _request: Request,
  context: { params: Promise<{ category: string }> }
) {
  try {
    const { category } = await context.params;
    if (!VALID_CATEGORIES.includes(category as SupportCategoryId)) {
      return NextResponse.json({ error: "Unsupported support category." }, { status: 404 });
    }

    const organizations = await getRankedOrganizations(category as SupportCategoryId);
    return NextResponse.json({ organizations });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error." },
      { status: 500 }
    );
  }
}
