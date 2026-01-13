import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
    const { documentId } = await req.json();

    const { data, error } = await supabaseServer
        .from("note_together")
        .insert({
            id: documentId,
            title: "",
            yjs_state: null,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ document: data });
}