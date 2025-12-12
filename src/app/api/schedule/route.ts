import { NextRequest, NextResponse } from "next/server";
import { loginToCyberVidya } from "@/lib/cybervidya";

const CYBER_BASE = "https://kiet.cybervidya.net";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const cyberId = url.searchParams.get("cyberId");
    const cyberPass = url.searchParams.get("cyberPass");
    const weekStartDate = url.searchParams.get("weekStartDate");
    const weekEndDate = url.searchParams.get("weekEndDate");
    
    // Authorization via Token
    const qToken = url.searchParams.get("token");
    const qUid = url.searchParams.get("uid");
    const qAuthPref = url.searchParams.get("authPref");

    if (!weekStartDate || !weekEndDate) {
      return NextResponse.json(
        { msg: "Missing date range for schedule API" },
        { status: 400 }
      );
    }
    
    let token = qToken;
    let uid = qUid ? Number(qUid) : 0;
    let authPref = qAuthPref || "GlobalEducation ";

    // Fallback to login if no token provided
    if (!token && cyberId && cyberPass) {
        // login first
        const login = await loginToCyberVidya(cyberId, cyberPass);
        if (login) {
            token = login.token;
            uid = login.uid;
            authPref = login.authPref;
        }
    }
    
    if (!token || !uid) {
        return NextResponse.json({ msg: "Authentication failed. No token or credentials." }, { status: 401 });
    }

    const headers = {
      Accept: "application/json",
      Authorization: `${authPref}${token}`,
      Uid: String(uid),
    };

    const cyberRes = await fetch(
      `${CYBER_BASE}/api/student/schedule/class?weekStartDate=${weekStartDate}&weekEndDate=${weekEndDate}`,
      { method: "GET", headers }
    );

    const rawText = await cyberRes.text();
    if (!cyberRes.ok) {
      return NextResponse.json({ msg: "CyberVidya schedule failed", rawText }, { status: 502 });
    }

    const json = JSON.parse(rawText);
    return NextResponse.json({ data: json.data || [] });
  } catch (err) {
    return NextResponse.json({ msg: "Server error", error: err }, { status: 500 });
  }
}
