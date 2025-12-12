// src/app/api/attendance/daywise/route.ts
import { NextRequest, NextResponse } from "next/server";
import { loginToCyberVidya } from "@/lib/cybervidya";

const CYBER_BASE = "https://kiet.cybervidya.net";

interface DaywiseEntry {
  date: string | null;
  day: string | null;
  timeSlot: string | null;
  status: string | null;
}

interface Lecture {
  planLecDate?: string;
  dayName?: string;
  timeSlot?: string;
  attendance?: string;
}

interface DaywiseData {
  lectureList?: Lecture[];
}

interface DaywiseResponse {
  data?: DaywiseData[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { courseCompId, courseId, sessionId, studentId, cyberId, cyberPass, token: reqToken, uid: reqUid, authPref: reqAuthPref } = body || {};

    if (!courseCompId || !courseId || !studentId) {
      return NextResponse.json(
        { msg: "Missing required fields for daywise attendance" },
        { status: 400 }
      );
    }

    let token = reqToken;
    let uid = reqUid;
    let authPref = reqAuthPref;

    // If no token provided, try login
    if (!token && cyberId && cyberPass) {
        console.log("⏩ CyberVidya login for daywise:", cyberId);
        const login = await loginToCyberVidya(cyberId, cyberPass);
        if (login) {
            token = login.token;
            uid = login.uid;
            authPref = login.authPref;
        }
    }

    if (!token || !uid) {
         return NextResponse.json({ msg: "Authentication failed. No valid token or credentials." }, { status: 401 });
    }

    const headers: HeadersInit = {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `${authPref}${token}`,
      Uid: String(uid),
    };

    // 2) USE PERCENTAGE ENDPOINT (works as daywise)
    const cyberRes = await fetch(
      `${CYBER_BASE}/api/attendance/schedule/student/course/attendance/percentage`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          courseCompId,
          courseId,
          sessionId: sessionId ?? null,
          studentId,
        }),
      }
    );

    const rawText = await cyberRes.text();
    console.log("🔍 PERCENTAGE status:", cyberRes.status);
    console.log("📦 PERCENTAGE raw:", rawText);

    if (!cyberRes.ok) {
      return NextResponse.json(
        { msg: "Upstream error", status: cyberRes.status, body: rawText },
        { status: 502 }
      );
    }

    // 3) Parse the response
    let json: DaywiseResponse;
    try {
      json = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ msg: "Invalid JSON structure" }, { status: 500 });
    }

    // 4) CyberVidya keeps daywise data inside lectureList
    const entries: DaywiseEntry[] = [];
    const dataArray: DaywiseData[] = Array.isArray(json.data) ? json.data : [];

    for (const item of dataArray) {
      const lectures: Lecture[] = Array.isArray(item.lectureList) ? item.lectureList : [];

      for (const lec of lectures) {
        entries.push({
          date: lec.planLecDate ?? null,
          day: lec.dayName ?? null,
          timeSlot: lec.timeSlot ?? null,
          status: lec.attendance ?? null,
        });
      }
    }

    if (!entries.length) {
      return NextResponse.json({ msg: "No daywise data found.", entries: [] });
    }

    return NextResponse.json({ entries });
  } catch (err) {
    console.error("Daywise API error:", err);
    return NextResponse.json({ msg: "Server error" }, { status: 500 });
  }
}
