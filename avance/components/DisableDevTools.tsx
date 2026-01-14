import { useEffect } from 'react';

export default function DisableDevTools() {
  useEffect(() => {
    // 1. Desabilitar Botão Direito
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // 2. Desabilitar Teclas de Atalho (F12, Ctrl+Shift+I, Ctrl+U, etc)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && e.key === 'I') || // Inspecionar
        (e.ctrlKey && e.shiftKey && e.key === 'J') || // Console
        (e.ctrlKey && e.key === 'U') || // Ver código fonte
        (e.ctrlKey && e.key === 'S') // Salvar página
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return null; // Esse componente não renderiza nada visualmente
}