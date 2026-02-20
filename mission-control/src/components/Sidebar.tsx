"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { href: "/", icon: "🏠", label: "Dashboard" },
  { href: "/tasks", icon: "📋", label: "Task Board" },
  { href: "/calendar", icon: "📅", label: "Calendar" },
  { href: "/docs", icon: "📝", label: "Docs" },
  { href: "/projects", icon: "🚀", label: "Projects" },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <motion.nav
      initial={false}
      animate={{ width: isCollapsed ? 64 : 256 }}
      className="bg-[#0f0f14] border-r border-white/5 flex flex-col h-screen sticky top-0"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/5">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Oblivio
              </h1>
              <p className="text-xs text-gray-500">Mission Control</p>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          {isCollapsed ? "▶" : "◀"}
        </button>
      </div>

      {/* Nav Items */}
      <div className="flex-1 py-4 space-y-1 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? "bg-purple-600/20 text-purple-400"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <div className={`flex items-center gap-2 ${isCollapsed ? "justify-center" : ""}`}>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-gray-500"
              >
                Oblivio online
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.nav>
  );
}
