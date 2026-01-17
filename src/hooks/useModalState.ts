import { useState, useCallback } from "react";

interface ModalData {
  open: boolean;
  leadId: string;
  leadNome: string;
}

const initialModalState: ModalData = {
  open: false,
  leadId: "",
  leadNome: "",
};

/**
 * Isolated hook for modal state management
 * Prevents re-renders of sibling components when modal state changes
 */
export function useModalState() {
  const [perdaModal, setPerdaModal] = useState<ModalData>(initialModalState);
  const [agendamentoModal, setAgendamentoModal] = useState<ModalData>(initialModalState);

  const openPerdaModal = useCallback((leadId: string, leadNome: string) => {
    setPerdaModal({ open: true, leadId, leadNome });
  }, []);

  const closePerdaModal = useCallback(() => {
    setPerdaModal(initialModalState);
  }, []);

  const openAgendamentoModal = useCallback((leadId: string, leadNome: string) => {
    setAgendamentoModal({ open: true, leadId, leadNome });
  }, []);

  const closeAgendamentoModal = useCallback(() => {
    setAgendamentoModal(initialModalState);
  }, []);

  return {
    perdaModal,
    agendamentoModal,
    openPerdaModal,
    closePerdaModal,
    openAgendamentoModal,
    closeAgendamentoModal,
  };
}
