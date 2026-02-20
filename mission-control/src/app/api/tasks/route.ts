import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "tasks.json");

type Status = "backlog" | "in_progress" | "in_review" | "done";
type Assignee = "yash" | "oblivio";

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: Status;
  assignee: Assignee;
  reviewNotes?: string;
  createdAt: number;
  updatedAt: number;
}

async function getTasks(): Promise<Task[]> {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveTasks(tasks: Task[]): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(tasks, null, 2));
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export async function GET() {
  const tasks = await getTasks();
  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const tasks = await getTasks();

  const newTask: Task = {
    _id: generateId(),
    title: body.title,
    description: body.description,
    status: body.status,
    assignee: body.assignee,
    reviewNotes: body.reviewNotes,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  tasks.push(newTask);
  await saveTasks(tasks);

  return NextResponse.json(newTask, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const tasks = await getTasks();

  const index = tasks.findIndex((t) => t._id === body.id);
  if (index === -1) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // Handle reviewNotes: set to undefined if approving (status -> done)
  const reviewNotes = body.status === "done" ? undefined : body.reviewNotes;

  tasks[index] = {
    ...tasks[index],
    ...body,
    reviewNotes,
    updatedAt: Date.now(),
  };

  await saveTasks(tasks);
  return NextResponse.json(tasks[index]);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  let tasks = await getTasks();
  tasks = tasks.filter((t) => t._id !== id);
  await saveTasks(tasks);

  return NextResponse.json({ success: true });
}
