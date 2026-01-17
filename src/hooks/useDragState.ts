import { useState, useCallback } from "react";

/**
 * Isolated hook for drag state management
 * Prevents re-renders of the entire page when drag state changes
 */
export function useDragState() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingDrop, setPendingDrop] = useState<{
    leadId: string;
    etapa: string;
  } | null>(null);

  const startDrag = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const endDrag = useCallback(() => {
    setActiveId(null);
  }, []);

  const setPending = useCallback((leadId: string, etapa: string) => {
    setPendingDrop({ leadId, etapa });
  }, []);

  const clearPending = useCallback(() => {
    setPendingDrop(null);
  }, []);

  return {
    activeId,
    pendingDrop,
    startDrag,
    endDrag,
    setPending,
    clearPending,
  };
}
