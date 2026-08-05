import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { FeedbackForm } from "./FeedbackForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Unobtrusive beta feedback entry point. */
export function FeedbackDialog({
  className,
  label = "Send feedback",
}: {
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("gap-2 rounded-xl text-muted-foreground hover:text-foreground", className)}
        >
          <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send feedback</DialogTitle>
          <DialogDescription>
            MindShift is in beta — telling us what broke or what's missing genuinely shapes what we
            build next.
          </DialogDescription>
        </DialogHeader>
        <FeedbackForm onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
