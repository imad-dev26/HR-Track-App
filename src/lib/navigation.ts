import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  CalendarDays,
  HeartPulse,
  Scale,
  GraduationCap,
  AlertTriangle,
  BarChart3,
  Bell,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  module: string;
}

export const NAV_ITEMS: NavItem[] = [
  { path: "/", label: "Tableau de bord", icon: LayoutDashboard, module: "dashboard" },
  { path: "/personnel", label: "Personnel", icon: Users, module: "personnel" },
  { path: "/organisation", label: "Organisation", icon: Building2, module: "organisation" },
  { path: "/contrats", label: "Contrats", icon: FileText, module: "contrats" },
  { path: "/conges", label: "Congés", icon: CalendarDays, module: "conges" },
  { path: "/medical", label: "Médical", icon: HeartPulse, module: "medical" },
  { path: "/discipline", label: "Discipline", icon: Scale, module: "discipline" },
  { path: "/formation", label: "Formation", icon: GraduationCap, module: "formation" },
  { path: "/accidents", label: "Accidents", icon: AlertTriangle, module: "accidents" },
  { path: "/rapports", label: "Rapports", icon: BarChart3, module: "rapports" },
  { path: "/notifications", label: "Notifications", icon: Bell, module: "notifications" },
  { path: "/administration", label: "Administration", icon: Settings, module: "administration" },
];
