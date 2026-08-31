import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home, Users, BookOpen, DoorOpen, Calendar, Clock, BookHeart,
  UtensilsCrossed, Settings, UserCheck, FileText, BarChart2,
  ChevronDown, ChevronRight, Building2, Baby, LogOut
} from "lucide-react";

const JS_JOY_LOGO = "https://cdn.builder.io/api/v1/image/assets%2F3e5d7cba4a39442dbacdba18064de92b%2F0ced3e0a6e0146d68409ab1369061a2d?format=webp&width=64";
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
    label: "My School",  // dynamically replaced with school name in the component
    icon: <Building2 size={18} />,
    children: [
      { label: "Students", to: "/students", icon: <Baby size={18} /> },
      { label: "Stories", to: "/stories", icon: <BookHeart size={18} /> },
      // Parents page removed — contact management is per-student in the student profile
      { label: "Rooms", to: "/rooms", icon: <DoorOpen size={18} /> },
      { label: "Calendar", to: "/calendar", icon: <Calendar size={18} /> },
      { label: "Schedules", to: "/schedule", icon: <Clock size={18} /> },
      { label: "Menus", to: "/menus", icon: <UtensilsCrossed size={18} /> },
      { label: "Settings", to: "/settings", icon: <Settings size={18} /> },
    ],
  },
  { label: "Staff & Payroll", to: "/staff", icon: <UserCheck size={18} /> },
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
            ${open ? "text-orange-500 bg-orange-50" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
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
          ? "text-orange-700 bg-orange-50 font-semibold"
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
  const { profile, school, allSchools, switchSchool, signOut } = useAuth();
  const [schoolOpen, setSchoolOpen] = useState(false);

  // Replace "My School" label with actual school name in nav
  const resolvedNav = navItems.map(item =>
    item.label === "My School" && school?.name
      ? { ...item, label: school.name }
      : item
  );

  const multiSchool = allSchools.length > 1;

  return (
    <aside className="w-60 shrink-0 h-screen flex flex-col bg-white border-r border-gray-200">
      {/* Logo + school switcher */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 shrink-0">
            <img src={JS_JOY_LOGO} alt="JS Joy Family" className="w-8 h-8 object-contain rounded-full" />
          </div>
          <span className="font-bold text-gray-900 text-sm">DayCarePortal</span>
        </div>

        {/* School switcher — shown always; dropdown only if multiple schools */}
        <div className="relative">
          <button
            onClick={() => multiSchool && setSchoolOpen(o => !o)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${multiSchool ? "hover:bg-gray-100 cursor-pointer text-gray-700 bg-gray-100 border border-gray-200" : "cursor-default text-gray-600 bg-gray-50"}`}
          >
            <span className="flex items-center gap-1.5 truncate">
              <Building2 size={13} className="shrink-0 text-gray-500" />
              <span className="truncate">{school?.name ?? "My School"}</span>
            </span>
            {multiSchool && (
              schoolOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />
            )}
          </button>

          {/* School dropdown */}
          {multiSchool && schoolOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
              {allSchools.map(s => (
                <button
                  key={s.id}
                  onClick={async () => { await switchSchool(s.id); setSchoolOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2
                    ${s.id === school?.id ? "bg-orange-50 text-orange-700 font-semibold border-l-2 border-orange-400" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  <Building2 size={11} className="shrink-0" />
                  <span className="truncate">{s.name}</span>
                  {s.id === school?.id && <span className="ml-auto text-orange-400 text-xs">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {resolvedNav.map(item => (
          <NavItemRow key={item.label} item={item} />
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-gray-100 px-3 py-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-semibold text-sm">
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
