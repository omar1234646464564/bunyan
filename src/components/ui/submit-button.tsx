"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonVariant, type ButtonSize } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SubmitButton({
  children,
  pendingText = "جارٍ الإرسال...",
  variant,
  size,
  className,
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      disabled={pending}
      className={cn(className)}
    >
      {pending ? pendingText : children}
    </Button>
  );
}
