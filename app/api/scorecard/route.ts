import { NextResponse } from "next/server"
import { scorecardData } from "@/data/scorecard-data"

export async function GET() {
  return NextResponse.json(scorecardData)
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Here you would typically validate the data structure
    // and save it to a database

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
  }
}
