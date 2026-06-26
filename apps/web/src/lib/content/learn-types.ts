export type LearnIconName =
  | "layout-dashboard"
  | "users"
  | "user-circle"
  | "map-pin"
  | "clock"
  | "history"
  | "file-edit"
  | "briefcase"
  | "building2"
  | "file-text"
  | "shopping-cart"
  | "arrow-left-right"
  | "landmark"
  | "dollar-sign"
  | "banknote"
  | "wallet"
  | "bar-chart3"
  | "scroll-text"
  | "settings"
  | "shield"
  | "credit-card"
  | "graduation-cap";

export type LearnPageSection = {
  title: string;
  description: string;
};

export type LearnWorkflow = {
  title: string;
  steps: string[];
};

export type LearnTestStep = {
  step: number;
  action: string;
  expected: string;
};

export type LearnModule = {
  id: string;
  title: string;
  category: string;
  icon: LearnIconName;
  summary: string;
  href: string;
  roles: ("owner" | "admin")[];
  overview: string;
  howItWorks: string[];
  pageSections: LearnPageSection[];
  workflows: LearnWorkflow[];
  testing: LearnTestStep[];
  tips: string[];
  relatedModuleIds: string[];
};

export type LearnCategory = {
  id: string;
  label: string;
  description: string;
};