import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "calendar-events.json");

export type EventType = "cron" | "task" | "reminder";

interface CalendarEvent {
  _id: string;
  title: string;
  description?: string;
  date: string; // ISO date string YYYY-MM-DD
  time?: string; // HH:MM
  endTime?: string;
  type: EventType;
  assignee?: "yash" | "oblivio";
  recurring?: "daily" | "weekly" | "monthly";
  cronId?: string; // Link to cron job if type is cron
  createdAt: number;
  updatedAt: number;
}

async function getEvents(): Promise<CalendarEvent[]> {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveEvents(events: CalendarEvent[]): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(events, null, 2));
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // YYYY-MM
  const startDate = searchParams.get("start"); // YYYY-MM-DD
  const endDate = searchParams.get("end"); // YYYY-MM-DD
  
  let events = await getEvents();
  
  // Filter by month if provided
  if (month) {
    events = events.filter(e => e.date.startsWith(month));
  }
  
  // Filter by date range if provided
  if (startDate && endDate) {
    events = events.filter(e => e.date >= startDate && e.date <= endDate);
  }
  
  return NextResponse.json(events);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const events = await getEvents();

  const newEvent: CalendarEvent = {
    _id: generateId(),
    title: body.title,
    description: body.description,
    date: body.date,
    time: body.time,
    endTime: body.endTime,
    type: body.type || "task",
    assignee: body.assignee,
    recurring: body.recurring,
    cronId: body.cronId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  events.push(newEvent);
  await saveEvents(events);

  return NextResponse.json(newEvent, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const events = await getEvents();

  const index = events.findIndex((e) => e._id === body.id);
  if (index === -1) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  events[index] = {
    ...events[index],
    ...body,
    updatedAt: Date.now(),
  };

  await saveEvents(events);
  return NextResponse.json(events[index]);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  let events = await getEvents();
  events = events.filter((e) => e._id !== id);
  await saveEvents(events);

  return NextResponse.json({ success: true });
}
