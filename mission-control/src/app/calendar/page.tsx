"use client";

import { useState, useEffect } from "react";

type EventType = "cron" | "task" | "reminder";

interface CalendarEvent {
  _id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  endTime?: string;
  type: EventType;
  assignee?: "yash" | "oblivio";
  recurring?: "daily" | "weekly" | "monthly";
  cronId?: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    type: "task" as EventType,
    assignee: "yash" as "yash" | "oblivio",
    recurring: "" as "" | "daily" | "weekly" | "monthly",
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Create calendar days array
  const calendarDays: { date: number; month: "prev" | "current" | "next"; fullDate: string }[] = [];

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    const date = daysInPrevMonth - i;
    const prevMonth = month === 0 ? 12 : month;
    const prevYear = month === 0 ? year - 1 : year;
    calendarDays.push({
      date,
      month: "prev",
      fullDate: `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(date).padStart(2, "0")}`,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      date: i,
      month: "current",
      fullDate: `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`,
    });
  }

  // Next month days
  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    const nextMonth = month === 11 ? 1 : month + 2;
    const nextYear = month === 11 ? year + 1 : year;
    calendarDays.push({
      date: i,
      month: "next",
      fullDate: `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(i).padStart(2, "0")}`,
    });
  }

  const fetchEvents = async () => {
    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    try {
      const res = await fetch(`/api/calendar?month=${monthStr}`);
      const data = await res.json();
      setEvents(data);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [year, month]);

  const getEventsForDate = (fullDate: string) => {
    return events.filter((e) => e.date === fullDate);
  };

  const getEventColor = (type: EventType) => {
    switch (type) {
      case "cron":
        return "bg-purple-500/30 border-purple-500 text-purple-300";
      case "reminder":
        return "bg-amber-500/30 border-amber-500 text-amber-300";
      default:
        return "bg-blue-500/30 border-blue-500 text-blue-300";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date) return;

    try {
      await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      await fetchEvents();
    } catch (error) {
      console.error("Failed to add event:", error);
    }

    setFormData({
      title: "",
      description: "",
      date: "",
      time: "",
      type: "task",
      assignee: "yash",
      recurring: "",
    });
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/calendar?id=${id}`, { method: "DELETE" });
      await fetchEvents();
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
            >
              ◀
            </button>
            <h1 className="text-2xl font-bold text-white">
              {MONTHS[month]} {year}
            </h1>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
            >
              ▶
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-gray-400"
            >
              Today
            </button>
          </div>
          <button
            onClick={() => {
              setFormData({ ...formData, date: new Date().toISOString().split("T")[0] });
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            + Add Event
          </button>
        </div>

        <div className="grid grid-cols-[1fr_320px] gap-6">
          {/* Calendar Grid */}
          <div className="bg-[#1a1a1f] rounded-xl overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-white/5">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="p-3 text-center text-sm font-medium text-gray-400"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                const dayEvents = getEventsForDate(day.fullDate);
                const isToday = day.fullDate === new Date().toISOString().split("T")[0];
                const isSelected = day.fullDate === selectedDate;
                const isCurrentMonth = day.month === "current";

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDate(day.fullDate)}
                    className={`min-h-[100px] p-2 border-r border-b border-white/5 cursor-pointer transition-colors ${
                      isCurrentMonth ? "" : "opacity-30"
                    } ${
                      isSelected
                        ? "bg-blue-500/10"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <div
                      className={`text-sm mb-1 ${
                        isToday
                          ? "w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white"
                          : isCurrentMonth
                          ? "text-white"
                          : "text-gray-500"
                      }`}
                    >
                      {day.date}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event._id}
                          className={`text-xs px-1.5 py-0.5 rounded border truncate ${getEventColor(
                            event.type
                          )}`}
                        >
                          {event.time && `${event.time} `}
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-500 px-1">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Sidebar */}
          <div className="bg-[#1a1a1f] rounded-xl p-4 h-fit">
            <h2 className="text-lg font-semibold text-white mb-4">
              {selectedDate
                ? new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })
                : "Select a date"}
            </h2>

            {selectedDate ? (
              selectedDateEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateEvents.map((event) => (
                    <div
                      key={event._id}
                      className={`p-3 rounded-lg border ${getEventColor(event.type)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-sm">
                            {event.time && `${event.time} - `}
                            {event.title}
                          </div>
                          {event.description && (
                            <div className="text-xs opacity-70 mt-1">
                              {event.description}
                            </div>
                          )}
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs opacity-60">
                              {event.type}
                            </span>
                            {event.assignee && (
                              <span className="text-xs opacity-60">
                                {event.assignee === "yash" ? "👤 Yash" : "🤖 Oblivio"}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(event._id)}
                          className="text-gray-500 hover:text-red-400 text-sm"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No events scheduled</p>
              )
            ) : (
              <p className="text-gray-500 text-sm">Click a date to see events</p>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500/30 rounded"></div>
            <span>Cron Job</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500/30 rounded"></div>
            <span>Task</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500/30 rounded"></div>
            <span>Reminder</span>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-white mb-4">Add Event</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#252525] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600"
                  placeholder="Event title"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#252525] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600 resize-none"
                  placeholder="Optional description"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#252525] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Time</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#252525] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as EventType })
                    }
                    className="w-full px-3 py-2 bg-[#252525] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="task">Task</option>
                    <option value="reminder">Reminder</option>
                    <option value="cron">Cron Job</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Assignee</label>
                  <select
                    value={formData.assignee}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        assignee: e.target.value as "yash" | "oblivio",
                      })
                    }
                    className="w-full px-3 py-2 bg-[#252525] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="yash">👤 Yash</option>
                    <option value="oblivio">🤖 Oblivio</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Recurring</label>
                <select
                  value={formData.recurring}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recurring: e.target.value as "" | "daily" | "weekly" | "monthly",
                    })
                  }
                  className="w-full px-3 py-2 bg-[#252525] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600"
                >
                  <option value="">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
