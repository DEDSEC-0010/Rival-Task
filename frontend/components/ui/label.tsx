import { forwardRef, type LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  function Label({ className, ...rest }, ref) {
    return (
      <label
        ref={ref}
        className={cn(
          "text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-1.5",
          className,
        )}
        {...rest}
      />
    );
  },
);
