"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

const COLUMNS: { status: Status; label: string; color: string }[] = [
  { status: "backlog", label: "Backlog", color: "#6b7280" },
  { status: "in_progress", label: "In Progress", color: "#f59e0b" },
  { status: "in_review", label: "In Review", color: "#8b5cf6" },
  { status: "done", label: "Done", color: "#10b981" },
];

function SortableTask({ task, onClick, onDelete }: { task: Task; onClick: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id,
    data: { task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isInReview = task.status === "in_review";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-[#252525] p-4 rounded-lg cursor-grab active:cursor-grabbing transition-all hover:-translate-y-0.5 hover:shadow-lg group ${
        isInReview ? "ring-2 ring-purple-500/50" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <h3 className="font-medium text-white">{task.title}</h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity text-xl leading-none"
        >
          ×
        </button>
      </div>
      {task.description && (
        <p className="text-sm text-gray-400 mt-1 line-clamp-2">{task.description}</p>
      )}
      {task.reviewNotes && (
        <div className="mt-2 px-2 py-1.5 bg-red-500/20 text-red-300 text-xs rounded border border-red-500/30">
          📝 Review: {task.reviewNotes}
        </div>
      )}
      <div className="mt-3 flex items-center gap-2">
        <span
          className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
            task.assignee === "yash"
              ? "bg-blue-600/30 text-blue-400"
              : "bg-purple-600/30 text-purple-400"
          }`}
        >
          {task.assignee === "yash" ? "👤 Yash" : "🤖 Oblivio"}
        </span>
        {isInReview && (
          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-purple-600/30 text-purple-400">
            🔍 Awaiting Review
          </span>
        )}
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  return (
    <div className={`bg-[#252525] p-4 rounded-lg cursor-grab ${task.status === "in_review" ? "ring-2 ring-purple-500/50" : ""}`}>
      <div className="flex items-start justify-between">
        <h3 className="font-medium text-white">{task.title}</h3>
      </div>
      {task.description && (
        <p className="text-sm text-gray-400 mt-1 line-clamp-2">{task.description}</p>
      )}
      <div className="mt-3">
        <span
          className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
            task.assignee === "yash"
              ? "bg-blue-600/30 text-blue-400"
              : "bg-purple-600/30 text-purple-400"
          }`}
        >
          {task.assignee === "yash" ? "👤 Yash" : "🤖 Oblivio"}
        </span>
      </div>
    </div>
  );
}


// Recycle Bin Component
function RecycleBin() {
  const { isOver, setNodeRef } = useDroppable({
    id: "recycle-bin",
  });

  return (
    <div
      ref={setNodeRef}
      className={`fixed bottom-6 right-6 w-48 h-16 rounded-xl border-2 border-dashed transition-all flex items-center justify-center gap-2 ${
        isOver
          ? "border-red-500 bg-red-500/20 scale-110"
          : "border-gray-600 bg-[#1a1a1f] hover:border-red-400"
      }`}
    >
      <span className={`text-2xl ${isOver ? "animate-bounce" : ""}`}>🗑️</span>
      <span className={`text-sm font-medium ${isOver ? "text-red-400" : "text-gray-400"}`}>
        Drop to Delete
      </span>
    </div>
  );
}

export default function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewingTask, setReviewingTask] = useState<Task | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "yash" | "oblivio">("all");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "backlog" as Status,
    assignee: "yash" as Assignee,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 3000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((t) => t._id === active.id);
    const overTask = tasks.find((t) => t._id === over.id);

    if (!activeTask) return;

    if (overTask && activeTask.status !== overTask.status) {
      setTasks((prev) =>
        prev.map((t) =>
          t._id === active.id ? { ...t, status: overTask.status } : t
        )
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Check if dropped on recycle bin
    if (over.id === "recycle-bin") {
      const taskId = active.id as string;
      try {
        await fetch(`/api/tasks?id=${taskId}`, { method: "DELETE" });
        setTasks((prev) => prev.filter((t) => t._id !== taskId));
      } catch (error) {
        console.error("Failed to delete task:", error);
      }
      return;
    }

    const activeTask = tasks.find((t) => t._id === active.id);
    if (!activeTask) return;

    const overTask = tasks.find((t) => t._id === over.id);
    
    // If dropped on another task in the SAME column, reorder
    if (overTask && activeTask.status === overTask.status) {
      // Reorder within the same column
      const columnTasks = tasks.filter(t => t.status === activeTask.status);
      const oldIndex = columnTasks.findIndex(t => t._id === active.id);
      const newIndex = columnTasks.findIndex(t => t._id === over.id);
      
      if (oldIndex !== newIndex) {
        // Reorder in local state
        const otherTasks = tasks.filter(t => t.status !== activeTask.status);
        const reorderedTasks = [...columnTasks];
        const [movedTask] = reorderedTasks.splice(oldIndex, 1);
        reorderedTasks.splice(newIndex, 0, movedTask);
        setTasks([...otherTasks, ...reorderedTasks]);
        console.log("Reordered task within column");
      }
      return;
    }

    // If dropped on a task in a DIFFERENT column, change status
    const newStatus = overTask ? overTask.status : activeTask.status;
    
    if (activeTask.status !== newStatus) {
      setTasks((prev) =>
        prev.map((t) =>
          t._id === active.id ? { ...t, status: newStatus } : t
        )
      );
      
      try {
        await fetch("/api/tasks", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: active.id, status: newStatus }),
        });
      } catch (error) {
        console.error("Failed to update task status:", error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      if (editingTask) {
        const res = await fetch("/api/tasks", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingTask._id, ...formData }),
        });
        if (res.ok) await fetchTasks();
      } else {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) await fetchTasks();
      }
    } catch (error) {
      console.error("Failed to save task:", error);
    }

    setFormData({ title: "", description: "", status: "backlog", assignee: "yash" });
    setEditingTask(null);
    setIsModalOpen(false);
  };

  const openReviewModal = (task: Task) => {
    setReviewingTask(task);
    setReviewAction(null);
    setReviewNotes("");
    setIsReviewModalOpen(true);
  };

  const handleReview = async () => {
    if (!reviewingTask || !reviewAction) return;

    try {
      if (reviewAction === "approve") {
        await fetch("/api/tasks", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: reviewingTask._id, status: "done", reviewNotes: null }),
        });
      } else {
        // Reject - send back to in_progress with notes
        await fetch("/api/tasks", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            id: reviewingTask._id, 
            status: "in_progress", 
            reviewNotes: reviewNotes || "Needs revision" 
          }),
        });
      }
      await fetchTasks();
    } catch (error) {
      console.error("Failed to review task:", error);
    }

    setIsReviewModalOpen(false);
    setReviewingTask(null);
    setReviewAction(null);
    setReviewNotes("");
  };

  const moveToReview = async (task: Task) => {
    try {
      await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task._id, status: "in_review", reviewNotes: null }),
      });
      await fetchTasks();
    } catch (error) {
      console.error("Failed to move to review:", error);
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({ title: task.title, description: task.description || "", status: task.status, assignee: task.assignee });
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingTask(null);
    setFormData({ title: "", description: "", status: "backlog", assignee: "yash" });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      if (res.ok) await fetchTasks();
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const filteredTasks = filter === "all" ? tasks : tasks.filter((t) => t.assignee === filter);
  const getTasksByStatus = (status: Status) => filteredTasks.filter((t) => t.status === status);

  // Oblivio's current focus
  const oblixvioFocus = tasks.filter((t) => t.assignee === "oblivio" && t.status === "in_progress");
  const oblixvioBacklog = tasks.filter((t) => t.assignee === "oblivio" && t.status === "backlog");
  const oblixvioInReview = tasks.filter((t) => t.assignee === "oblivio" && t.status === "in_review");

  // Tasks pending your review (that you can review)
  const tasksForReview = tasks.filter((t) => t.status === "in_review" && t.assignee === "oblivio");

  const activeTask = activeId ? tasks.find((t) => t._id === activeId) : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading tasks...</div>
      </div>
    );
  }

  // Debug: log when component renders
  console.log("TaskBoard rendering, tasks:", tasks.length, "loading:", loading);

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <h1 className="text-3xl font-bold text-white">Task Board</h1>
        <p className="text-gray-400 mt-4">Loading... ({tasks.length} tasks loaded)</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Task Board - {tasks.length} tasks</h1>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Filter:</span>
            <div className="flex bg-[#1a1a1a] rounded-lg p-1">
              {(["all", "yash", "oblivio"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    filter === f
                      ? f === "yash"
                        ? "bg-blue-600 text-white"
                        : f === "oblivio"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {f === "all" ? "All" : f === "yash" ? "👤 Yash" : "🤖 Oblivio"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Oblivio's Live Focus Section */}
        {(oblixvioFocus.length > 0 || oblixvioBacklog.length > 0) && (
          <div className="mb-8 bg-gradient-to-r from-purple-900/30 to-purple-600/10 rounded-xl p-5 border border-purple-500/30">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🤖</span>
              <h2 className="text-xl font-bold text-white">Oblivio's Focus</h2>
              <span className="flex h-3 w-3 ml-2">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
              </span>
            </div>
            {oblixvioFocus.length > 0 && (
              <div className="mb-3">
                <span className="text-xs uppercase tracking-wide text-purple-400 font-medium">Now Working On</span>
                <div className="mt-2 space-y-2">
                  {oblixvioFocus.map((task) => (
                    <div key={task._id} className="flex items-center gap-3 bg-purple-500/20 px-4 py-3 rounded-lg border border-purple-500/30">
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                      <span className="text-white font-medium">{task.title}</span>
                      {task.description && <span className="text-gray-400 text-sm">— {task.description}</span>}
                      <button
                        onClick={() => moveToReview(task)}
                        className="ml-auto px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg font-medium transition-colors"
                      >
                        Submit for Review →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {oblixvioBacklog.length > 0 && (
              <div>
                <span className="text-xs uppercase tracking-wide text-gray-400 font-medium">Up Next</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {oblixvioBacklog.map((task) => (
                    <span key={task._id} className="px-3 py-1.5 bg-[#252525] text-gray-300 text-sm rounded-lg">
                      {task.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Review Section - Tasks waiting for Yash's approval */}
        {tasksForReview.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-amber-900/30 to-orange-600/10 rounded-xl p-5 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">👤</span>
              <h2 className="text-xl font-bold text-white">Review Required</h2>
              <span className="px-2 py-0.5 bg-amber-500/30 text-amber-400 text-xs font-medium rounded-full">
                {tasksForReview.length} pending
              </span>
            </div>
            <div className="space-y-3">
              {tasksForReview.map((task) => (
                <div key={task._id} className="flex items-center gap-4 bg-[#1a1a1a] px-4 py-3 rounded-lg border border-amber-500/30">
                  <div className="flex-1">
                    <span className="text-white font-medium">{task.title}</span>
                    {task.description && <span className="text-gray-400 text-sm ml-2">— {task.description}</span>}
                  </div>
                  <button
                    onClick={() => openReviewModal(task)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg font-medium transition-colors"
                  >
                    Review →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={openAddModal} className="mb-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
          + Add Task
        </button>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-4 gap-4">
            {COLUMNS.map((col) => (
              <div key={col.status} className="bg-[#1a1a1a] rounded-xl overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: col.color + "20" }}>
                  <h2 className="font-semibold text-white">{col.label}</h2>
                  <span className="px-2 py-0.5 text-sm rounded-full" style={{ backgroundColor: col.color + "30", color: col.color }}>
                    {getTasksByStatus(col.status).length}
                  </span>
                </div>
                <div className="p-3 space-y-3 min-h-[200px]">
                  <SortableContext items={getTasksByStatus(col.status).map((t) => t._id)} strategy={verticalListSortingStrategy}>
                    {getTasksByStatus(col.status).map((task) => (
                      <SortableTask key={task._id} task={task} onClick={() => openEditModal(task)} onDelete={() => handleDelete(task._id)} />
                    ))}
                  </SortableContext>
                  {getTasksByStatus(col.status).length === 0 && <p className="text-gray-500 text-sm text-center py-8">No tasks</p>}
                </div>
              </div>
            ))}
          </div>

          <DragOverlay>
            {activeTask && <TaskCard task={activeTask} />}
          </DragOverlay>
        {/* Recycle Bin - must be inside DndContext for drop to work */}
        <RecycleBin />
        </DndContext>
      </div>

      {/* Add/Edit Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-white mb-4">{editingTask ? "Edit Task" : "Add New Task"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-[#252525] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600"
                  placeholder="Task title"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#252525] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600 resize-none"
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Status })}
                    className="w-full px-3 py-2 bg-[#252525] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="backlog">Backlog</option>
                    <option value="in_progress">In Progress</option>
                    <option value="in_review">In Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Assignee</label>
                  <select
                    value={formData.assignee}
                    onChange={(e) => setFormData({ ...formData, assignee: e.target.value as Assignee })}
                    className="w-full px-3 py-2 bg-[#252525] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="yash">👤 Yash</option>
                    <option value="oblivio">🤖 Oblivio</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingTask(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  {editingTask ? "Save" : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {isReviewModalOpen && reviewingTask && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-white mb-2">Review Task</h2>
            <p className="text-gray-400 text-sm mb-4">"{reviewingTask.title}"</p>
            
            <div className="space-y-3 mb-4">
              <button
                onClick={() => setReviewAction("approve")}
                className={`w-full rounded-lg border-2 transition-all ${
                  reviewAction === "approve"
                    ? "border-green-500 bg-green-500/20 text-green-400"
                    : "border-gray-700 hover:border-green-500/50 text-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div className="text-left">
                    <div className="font-medium">Approve</div>
                    <div className="text-xs opacity-70">Mark as done, good to go</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setReviewAction("reject")}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  reviewAction === "reject"
                    ? "border-red-500 bg-red-500/20 text-red-400"
                    : "border-gray-700 hover:border-red-500/50 text-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔄</span>
                  <div className="text-left">
                    <div className="font-medium">Request Changes</div>
                    <div className="text-xs opacity-70">Send back for revisions</div>
                  </div>
                </div>
              </button>
            </div>

            {reviewAction === "reject" && (
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Feedback (what needs to be changed)</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#252525] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600 resize-none"
                  placeholder="e.g., The colors are wrong, please use blue instead of purple..."
                  rows={3}
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsReviewModalOpen(false);
                  setReviewingTask(null);
                  setReviewAction(null);
                  setReviewNotes("");
                }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={!reviewAction}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  reviewAction
                    ? reviewAction === "approve"
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                }`}
              >
                {reviewAction === "approve" ? "Approve" : "Send Back"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
