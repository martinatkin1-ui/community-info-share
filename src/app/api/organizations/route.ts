import { NextResponse } from "next/server";

import { createReadOnlyClient } from "@/lib/supabase/server";

/**
 * Returns the minimal fields needed to populate organisation selectors in forms.
 * Email and phone are intentionally excluded from public responses.
 */
export async function GET() {
  try {
    const supabase = createReadOnlyClient();

    const { data, error } = await supabase
      .from("organizations")
      .select("id, name, city")
      .eq("verification_status", "verified")
      .order("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ organizations: data ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error." },
      { status: 500 }
    );
  }
}
