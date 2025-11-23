import { Link, useLocation } from "react-router-dom";
import { MessageSquare, Zap, AlertTriangle, Building2 } from "lucide-react";

export function MobileNav() {
  const location = useLocation();

  const navItems = [
    { path: "/reviews", label: "Reviews", icon: MessageSquare },
    { path: "/auto-reply", label: "Auto-Reply", icon: Zap },
    { path: "/escalations", label: "Escalations", icon: AlertTriangle },
    { path: "/business-info", label: "Info", icon: Building2 },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-around p-2 z-50 pb-safe">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              isActive
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
