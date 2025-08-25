"use client";

// To avoid introducing an extra dependency, we alias our existing Dialog components
// to AlertDialog exports. This gives us a confirm-style dialog API without
// requiring @radix-ui/react-alert-dialog.

export {
  Dialog as AlertDialog,
  DialogTrigger as AlertDialogTrigger,
  DialogContent as AlertDialogContent,
  DialogHeader as AlertDialogHeader,
  DialogFooter as AlertDialogFooter,
  DialogTitle as AlertDialogTitle,
  DialogDescription as AlertDialogDescription,
} from "./dialog";
