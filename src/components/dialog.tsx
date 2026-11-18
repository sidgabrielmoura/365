"use client";
import { useEffect, useRef, type ReactNode } from "react";
export function Dialog({
  title,
  onClose,
  children,
  className = "",
  bare = false,
  unwrapped = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  bare?: boolean;
  unwrapped?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      previous?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      className={className}
      ref={ref}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        close.current();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const box = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < box.x ||
            event.clientX > box.right ||
            event.clientY < box.y ||
            event.clientY > box.bottom
          )
            onClose();
        }
      }}
    >
      {!bare && (
        <button
          className="modal-close icon-button"
          aria-label="Fechar"
          onClick={onClose}
        >
          ×
        </button>
      )}
      {unwrapped ? children : <div id="modal-content">{children}</div>}
    </dialog>
  );
}
