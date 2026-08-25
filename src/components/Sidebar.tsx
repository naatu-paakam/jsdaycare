import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home, Users, BookOpen, DoorOpen, Calendar, Clock,
  UtensilsCrossed, Settings, UserCheck, FileText, BarChart2,
  ChevronDown, ChevronRight, Building2, Baby, LogOut
} from "lucide-react";
import { useAuth } from "@/lib/auth";

interface NavItem {
  label: string;
  to?: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { label: "Home", to: "/home", icon: <Home size={18} /> },
  {
    label: "My School",
    icon: <Building2 size={18} />,
    children: [
      { label: "Students", to: "/students", icon: <Baby size={18} /> },
      { label: "Parents", to: "/parents", icon: <Users size={18} /> },
      { label: "Rooms", to: "/rooms", icon: <DoorOpen size={18} /> },
      { label: "Calendar", to: "/calendar", icon: <Calendar size={18} /> },
      { label: "Schedules", to: "/schedule", icon: <Clock size={18} /> },
      { label: "Menus", to: "/menus", icon: <UtensilsCrossed size={18} /> },
      { label: "Settings", to: "/settings", icon: <Settings size={18} /> },
    ],
  },
  { label: "Staff & Payroll", to: "/staff", icon: <UserCheck size={18} /> },
  { label: "Admissions", to: "/admissions", icon: <BookOpen size={18} /> },
  { label: "Paperwork", to: "/paperwork", icon: <FileText size={18} /> },
  {
    label: "Reporting",
    icon: <BarChart2 size={18} />,
    children: [
      { label: "Overview", to: "/reporting", icon: <BarChart2 size={16} /> },
      { label: "Attendance", to: "/reporting/attendance", icon: <UserCheck size={16} /> },
    ],
  },
];

function NavItemRow({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const location = useLocation();
  const [open, setOpen] = useState(() => {
    if (!item.children) return false;
    return item.children.some(c => c.to && location.pathname.startsWith(c.to));
  });

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
            ${open ? "text-indigo-600 bg-indigo-50" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          <span className="text-gray-400">{item.icon}</span>
          <span className="flex-1 text-left">{item.label}</span>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {open && (
          <div className="mt-0.5">
            {item.children.map(child => (
              <NavItemRow key={child.label} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.to!}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
        ${isActive
          ? "text-indigo-700 bg-indigo-50 font-semibold"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`
      }
      style={{ paddingLeft: `${12 + depth * 16}px` }}
    >
      <span className="text-gray-400">{item.icon}</span>
      {item.label}
    </NavLink>
  );
}

export default function Sidebar() {
  const { profile, signOut } = useAuth();

  return (
    <aside className="w-60 shrink-0 h-screen flex flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Baby size={18} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-base">JsDayCare</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map(item => (
          <NavItemRow key={item.label} item={item} />
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-gray-100 px-3 py-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
            {profile?.full_name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">{profile?.full_name ?? "User"}</p>
            <p className="text-xs text-gray-400 capitalize">{profile?.role ?? ""}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 text-xs text-gray-500 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
