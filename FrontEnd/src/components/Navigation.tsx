import { Link, useLocation } from "react-router-dom";
import { Home, Building2 } from "lucide-react";

export function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/business-info", label: "Business Info", icon: Building2 },
  ];

  return (
    <nav className="flex items-center gap-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isActive
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
