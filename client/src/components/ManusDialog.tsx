import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

interface ManusDialogProps {
  title?: string;
  logo?: string;
  open?: boolean;
  onLogin: () => void;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
}

export function ManusDialog({
  title,
  logo,
  open = false,
  onLogin,
  onOpenChange,
  onClose,
}: ManusDialogProps) {
  const [internalOpen, setInternalOpen] = useState(open);

  const isControlled = !!onOpenChange;
  const effectiveOpen = isControlled ? open : internalOpen;

  const handleOpenChange = (nextOpen: boolean) => {
    if (isControlled) {
      onOpenChange(nextOpen);
    } else {
      setInternalOpen(nextOpen);
    }

    if (!nextOpen) {
      onClose?.();
    }
  };

  return (
    <Dialog
      open={effectiveOpen}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="py-5 bg-card w-[400px] shadow-lg border border-border backdrop-blur-2xl p-0 gap-0 text-center">
        <div className="flex flex-col items-center gap-2 p-5 pt-12">
          {logo ? (
            <div className="w-16 h-16 bg-background border border-border flex items-center justify-center">
              <img
                src={logo}
                alt="Dialog graphic"
                className="w-10 h-10"
              />
            </div>
          ) : null}

          {title ? (
            <DialogTitle className="text-xl font-semibold text-foreground leading-[26px] tracking-[-0.44px]">
              {title}
            </DialogTitle>
          ) : null}
          <DialogDescription className="text-sm text-muted-foreground leading-5 tracking-[-0.154px]">
            Please login with Manus to continue
          </DialogDescription>
        </div>

        <DialogFooter className="px-5 py-5">
          <Button
            onClick={onLogin}
            className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium leading-5 tracking-[-0.154px]"
          >
            Login with Manus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
