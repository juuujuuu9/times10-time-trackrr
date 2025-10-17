// Type declarations for DialogueSystem
declare global {
  interface Window {
    DialogueSystem: {
      confirm: (title: string, message: string, confirmText?: string, cancelText?: string) => Promise<boolean>;
      alert: (title: string, message: string, type?: string) => Promise<void>;
      success: (title: string, message: string) => Promise<void>;
      error: (title: string, message: string) => Promise<void>;
      info: (title: string, message: string) => Promise<void>;
      showDialogue: (options: {
        title?: string;
        message?: string;
        confirmText?: string;
        cancelText?: string;
        type?: string;
        onConfirm?: () => void;
        onCancel?: () => void;
        onClose?: () => void;
      }) => Promise<boolean>;
    };
  }
}

export {};
