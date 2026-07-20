import { useEffect, useRef, type ReactNode } from "react";
import "./sheet.css";

interface Props {
  open: boolean;
  onClose: () => void;
  className?: string;
  children: ReactNode;
  label?: string;
}

/**
 * Native <dialog> bottom sheet. Drives showModal()/close() from the `open`
 * prop, closes on backdrop click + Esc, and animates via .fp-sheet CSS.
 */
export function BottomSheet({ open, onClose, className = "", children, label }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    else if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      className={`fp-sheet ${className}`}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {children}
    </dialog>
  );
}
