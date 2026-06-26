// ============================================
// Punchless — Shared UI Components
// ============================================
// 
// Usage (direct file imports — recommended):
//   import { Button } from "@punchless/ui/components/button";
//   import { Modal } from "@punchless/ui/components/modal";
//   import { cn } from "@punchless/ui/lib/utils";
//
// Usage (barrel export):
//   import { Button, Modal, Dialog } from "@punchless/ui";
//

// Primitives
export { Button, buttonVariants } from "./components/button";
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "./components/dialog";
export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./components/alert-dialog";
export { VisuallyHidden } from "./components/visually-hidden";

// Composed / Reusable
export { Modal, type ModalProps } from "./components/modal";
export { ConfirmModal, type ConfirmModalProps } from "./components/confirm-modal";
export { PageHeader, type PageHeaderProps } from "./components/page-header";
export { Breadcrumbs, type BreadcrumbsProps, type BreadcrumbItem } from "./components/breadcrumbs";
export {
  CollapsibleNavGroup,
  type CollapsibleNavGroupProps,
} from "./components/collapsible-nav-group";
export { DataTable, type DataTableProps, type DataTableColumn } from "./components/data-table";
export {
  PaymentModeSelect,
  PAYMENT_MODES,
  type PaymentMode,
  type PaymentModeSelectProps,
} from "./components/payment-mode-select";
export {
  StatementLetterhead,
  type StatementLetterheadProps,
} from "./components/statement-letterhead";
export {
  StatementEntityBox,
  type StatementEntityBoxProps,
} from "./components/statement-entity-box";
export {
  BalanceBadge,
  type BalanceBadgeProps,
  type BalanceMeta,
  type BalanceStatus,
} from "./components/balance-badge";
export {
  StatementToolbar,
  type StatementToolbarProps,
} from "./components/statement-toolbar";
export {
  StatementTable,
  type StatementTableProps,
  type StatementTableLabels,
  type StatementTableRow,
} from "./components/statement-table";

// Utils
export { cn } from "./lib/utils";
