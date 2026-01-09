import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(
    req: Request,
    context: { params: Promise<{ documentId: string }> }
) {
    const { documentId } = await context.params;
    
    const { data, error } = await supabaseServer
        .from("note_together")
        .select("*")
        .eq("id", documentId)
        .single();

    if (error || !data) {
        return NextResponse.json(
        { error: error?.message || "Document not found" },
        { status: 404 }
        );
    }

    return NextResponse.json({ document: data });
}