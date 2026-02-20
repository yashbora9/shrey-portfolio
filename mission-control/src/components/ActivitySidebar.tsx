"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

export function ActivitySidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subagentStatus, setSubagentStatus] = useState<{ active: string[]; recent: string[] }>({ active: [], recent: [] });

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch("/api/tasks");
        const data = await res.json();
        setTasks(data);
      } catch (e) {
        // Ignore errors
      }
    };

    fetchTasks();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, []);

  const oblixvioTasks = tasks.filter((t) => t.assignee === "oblivio" && t.status !== "done");
  const inProgress = oblixvioTasks.filter((t) => t.status === "in_progress");
  const inReview = oblixvioTasks.filter((t) => t.status === "in_review");
  const backlog = oblixvioTasks.filter((t) => t.status === "backlog");

  return (
    <motion.nav
      initial={false}
      animate={{ width: isCollapsed ? 64 : 320 }}
      className="bg-[#0f0f14] border-l border-white/5 flex flex-col h-screen sticky top-0"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-lg">🤖</span>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <span className="font-semibold text-white whitespace-nowrap">Oblivio</span>
                {inProgress.length > 0 && (
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors flex-shrink-0"
        >
          {isCollapsed ? "◀" : "▶"}
        </button>
      </div>

      {/* Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 overflow-y-auto p-4 space-y-6"
          >
            {/* Currently Working On */}
            {inProgress.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wide text-purple-400 font-medium mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></span>
                  Working On
                </div>
                <div className="space-y-2">
                  {inProgress.map((task) => (
                    <div
                      key={task._id}
                      className="bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-3"
                    >
                      <div className="text-sm text-white font-medium">{task.title}</div>
                      {task.description && (
                        <div className="text-xs text-gray-400 mt-1">{task.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Awaiting Review */}
            {inReview.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wide text-amber-400 font-medium mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                  Awaiting Your Review
                </div>
                <div className="space-y-2">
                  {inReview.map((task) => (
                    <div
                      key={task._id}
                      className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-3"
                    >
                      <div className="text-sm text-white font-medium">{task.title}</div>
                      <a href="/tasks" className="text-xs text-amber-400 hover:underline mt-2 inline-block">
                        Review →
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Up Next (Backlog) */}
            {backlog.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500 font-medium mb-2">Up Next</div>
                <div className="space-y-1.5">
                  {backlog.map((task) => (
                    <div
                      key={task._id}
                      className="px-3 py-2 bg-[#1a1a1f] text-gray-400 text-sm rounded-lg"
                    >
                      {task.title}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nothing doing */}
            {oblixvioTasks.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-8">
                Waiting for tasks...
              </div>
            )}

            {/* Subagents Status */}
            {subagentStatus.active.length > 0 && (
              <div className="pt-2 border-t border-white/5">
                <div className="text-xs uppercase tracking-wide text-blue-400 font-medium mb-2">Subagents</div>
                <div className="space-y-1">
                  {subagentStatus.active.map((agent, i) => (
                    <div key={i} className="text-sm text-gray-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                      {agent}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed State - Show indicator */}
      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center py-4 gap-4">
          {inProgress.length > 0 && (
            <div className="flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
            </div>
          )}
          {inReview.length > 0 && (
            <div className="w-3 h-3 bg-amber-400 rounded-full" title={`${inReview.length} awaiting review`}></div>
          )}
        </div>
      )}
    </motion.nav>
  );
}
