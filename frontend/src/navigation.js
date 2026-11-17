// navigation.js - the list of all pages shown in the sidebar.
// Add a page here once and it appears in the menu automatically.
import {
  Building2,
  CalendarCheck,
  CalendarDays,
  Clock,
  FileText,
  LayoutDashboard,
  ListChecks,
  Users,
  Wallet,
} from "lucide-react";

export const NAV_SECTIONS = [
  {
    title: "Overview",
    links: [{ path: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "People",
    links: [
      { path: "/employees", label: "Employees", icon: Users },
      { path: "/departments", label: "Departments", icon: Building2 },
    ],
  },
  {
    title: "Leave",
    links: [
      { path: "/leave-types", label: "Leave Types", icon: ListChecks },
      { path: "/leave-requests", label: "Leave Requests", icon: CalendarDays },
      { path: "/short-leaves", label: "Short Leave", icon: Clock },
    ],
  },
  {
    title: "Time",
    links: [{ path: "/attendance", label: "Attendance", icon: CalendarCheck }],
  },
  {
    title: "Payroll",
    links: [
      { path: "/salary-requests", label: "Salary Requests", icon: Wallet },
      { path: "/salary-certificates", label: "Salary Certificates", icon: FileText },
    ],
  },
];

// A flat list of all links: [{path, label, icon}, ...]
export const ALL_LINKS = NAV_SECTIONS.flatMap((section) => section.links);
