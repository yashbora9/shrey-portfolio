import Link from "next/link";

const FEATURES = [
  {
    title: "Task Board",
    description: "Track and manage tasks with drag-and-drop, live sync, and review workflow",
    href: "/tasks",
    icon: "📋",
    color: "from-blue-600/20 to-blue-600/5",
    borderColor: "border-blue-500/30",
  },
  {
    title: "Calendar",
    description: "View and manage events, schedules, and deadlines",
    href: "/calendar",
    icon: "📅",
    color: "from-green-600/20 to-green-600/5",
    borderColor: "border-green-500/30",
    comingSoon: true,
  },
  {
    title: "Docs",
    description: "Create and organize documentation, notes, and knowledge base",
    href: "/docs",
    icon: "📝",
    color: "from-yellow-600/20 to-yellow-600/5",
    borderColor: "border-yellow-500/30",
    comingSoon: true,
  },
  {
    title: "Projects",
    description: "Manage projects, milestones, and deliverables",
    href: "/projects",
    icon: "🚀",
    color: "from-purple-600/20 to-purple-600/5",
    borderColor: "border-purple-500/30",
    comingSoon: true,
  },
];

export default function Home() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Mission Control</h1>
          <p className="text-gray-400">Your command center for getting things done</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {FEATURES.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className={`block p-6 rounded-xl bg-gradient-to-br ${feature.color} border ${feature.borderColor} hover:scale-[1.02] transition-transform ${
                feature.comingSoon ? "opacity-60" : ""
              }`}
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h2 className="text-xl font-semibold text-white mb-1">
                {feature.title}
                {feature.comingSoon && (
                  <span className="ml-2 text-xs px-2 py-0.5 bg-gray-600/50 text-gray-300 rounded-full">Coming Soon</span>
                )}
              </h2>
              <p className="text-sm text-gray-400">{feature.description}</p>
            </Link>
          ))}
        </div>
        
        <div className="mt-8 p-4 bg-[#1a1a1f] rounded-xl border border-white/5">
          <h3 className="text-sm font-medium text-gray-400 mb-2">💡 Quick Tip</h3>
          <p className="text-sm text-gray-500">
            Click on "Task Board" to start tracking tasks. I&apos;ll keep it updated with what I&apos;m working on, and you can review and approve my output.
          </p>
        </div>
      </div>
    </div>
  );
}
