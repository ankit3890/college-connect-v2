
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/syllabus/db";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDb();

        // Import model after connection is established
        const { DocumentModel } = await import("@/models/syllabus/Document");

        const { id } = await params;

        console.log(`[Syllabus Subject] Looking for document with ID: ${id}`);

        const doc = await DocumentModel.findById(id);
        if (doc) {
            console.log(`[Syllabus Subject] Found document: ${doc.title}`);
            return NextResponse.json({ doc, entries: doc.metadata.entries || [] });
        }

        console.log(`[Syllabus Subject] Document not found for ID: ${id}`);
        return NextResponse.json({ error: "Document not found", id }, { status: 404 });
    } catch (err: any) {
        console.error("[Syllabus Subject] Error:", err);
        return NextResponse.json({
            error: "Internal Server Error",
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }, { status: 500 });
    }
}
