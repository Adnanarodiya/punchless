import {
  LayoutDashboard,
  Users,
  UserCircle,
  MapPin,
  Clock,
  History,
  FileEdit,
  Briefcase,
  Building2,
  FileText,
  ShoppingCart,
  ArrowLeftRight,
  Landmark,
  DollarSign,
  Banknote,
  Wallet,
  BarChart3,
  ScrollText,
  Settings,
  Shield,
  CreditCard,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";

import type { LearnIconName } from "./learn-types";

const iconMap: Record<LearnIconName, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  users: Users,
  "user-circle": UserCircle,
  "map-pin": MapPin,
  clock: Clock,
  history: History,
  "file-edit": FileEdit,
  briefcase: Briefcase,
  building2: Building2,
  "file-text": FileText,
  "shopping-cart": ShoppingCart,
  "arrow-left-right": ArrowLeftRight,
  landmark: Landmark,
  "dollar-sign": DollarSign,
  banknote: Banknote,
  wallet: Wallet,
  "bar-chart3": BarChart3,
  "scroll-text": ScrollText,
  settings: Settings,
  shield: Shield,
  "credit-card": CreditCard,
  "graduation-cap": GraduationCap,
};

export function LearnIcon({
  name,
  className,
}: {
  name: LearnIconName;
  className?: string;
}) {
  const Icon = iconMap[name];
  return <Icon className={className} aria-hidden />;
}