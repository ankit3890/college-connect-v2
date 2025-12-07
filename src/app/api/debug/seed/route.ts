import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Community from "@/models/Community";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const defaults = [
        { name: "Dev", description: "Official Developer Community", isVerified: true, icon: "💻" },
        { name: "Suggestions", description: "Product Suggestions and Feedback", isVerified: true, icon: "💡" },
        { name: "Cricket", description: "For the love of the game", isVerified: true, icon: "🏏" },
        { name: "Materials", description: "Study materials and resources", isVerified: true, icon: "📚" }
    ];

    const results = [];
    for (const d of defaults) {
        const existing = await Community.findOne({ name: d.name });
        if (!existing) {
            const c = await Community.create({
                name: d.name,
                description: d.description,
                icon: d.icon,
                creator: "system",
                members: ["system"],
                isVerified: d.isVerified,
                isClosed: false
            });
            results.push(c);
        } else {
            results.push({ name: d.name, status: "already_exists"});
        }
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
