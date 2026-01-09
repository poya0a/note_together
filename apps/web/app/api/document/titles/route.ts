import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

type RequestBody = {
    documentIds: string[];
};

export async function POST(req: NextRequest) {
    try {
        const { documentIds } = (await req.json()) as RequestBody;
console.log(documentIds)
        if (!Array.isArray(documentIds) || documentIds.length === 0) {
            return NextResponse.json({ documents: [] }, { status: 200 });
        }

        const { data, error } = await supabaseServer
            .from("note_together")
            .select("id, title")
            .in("id", documentIds)
            .order("created_at", { ascending: false });

        if (error) {
        console.error("[SUPABASE_ERROR]", error);
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
        }

        return NextResponse.json({ documents: data ?? [] });
    } catch (error) {
        console.error("[GET_DOCUMENT_TITLES]", error);
        return NextResponse.json(
            { message: "Failed to fetch document titles" },
            { status: 500 }
        );
    }
}
