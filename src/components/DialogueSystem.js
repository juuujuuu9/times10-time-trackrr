// Dialogue System for replacing alerts and confirms
class DialogueSystem {
  constructor() {
    this.dialogueContainer = null;
    this.currentDialogue = null;
    this.init();
  }

  init() {
    // Create dialogue container if it doesn't exist
    if (!document.getElementById('dialogue-container')) {
      this.dialogueContainer = document.createElement('div');
      this.dialogueContainer.id = 'dialogue-container';
      this.dialogueContainer.className = 'fixed inset-0 z-50 hidden';
      document.body.appendChild(this.dialogueContainer);
    } else {
      this.dialogueContainer = document.getElementById('dialogue-container');
    }
  }

  showDialogue({
    title = 'Confirm Action',
    message = 'Are you sure you want to perform this action?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'warning', // warning, error, info, success
    onConfirm = () => {},
    onCancel = () => {},
    onClose = () => {}
  }) {
    return new Promise((resolve) => {
      const dialogueId = 'dialogue-' + Date.now();
      
      const typeStyles = this.getTypeStyles(type);
      
      const dialogueHTML = `
        <div id="${dialogueId}" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white transform transition-all duration-300">
            <div class="mt-3">
              <!-- Modal Header -->
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-medium text-gray-900">${title}</h3>
                <button 
                  id="close-${dialogueId}"
                  class="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <!-- Modal Content -->
              <div class="mb-6">
                <div class="flex items-start">
                  <div class="flex-shrink-0 mr-3 ${typeStyles.iconColor}">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${typeStyles.icon}"></path>
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="text-sm text-gray-700 whitespace-pre-line">${message}</p>
                  </div>
                </div>
              </div>

              <!-- Modal Actions -->
              <div class="flex justify-end space-x-3">
                <button 
                  id="cancel-${dialogueId}"
                  class="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium rounded-md transition-colors duration-200"
                >
                  ${cancelText}
                </button>
                <button 
                  id="confirm-${dialogueId}"
                  class="px-4 py-2 font-medium rounded-md transition-colors duration-200 ${typeStyles.confirmButton}"
                >
                  ${confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      this.dialogueContainer.innerHTML = dialogueHTML;
      this.dialogueContainer.classList.remove('hidden');
      this.currentDialogue = dialogueId;

      // Event listeners
      const confirmBtn = document.getElementById(`confirm-${dialogueId}`);
      const cancelBtn = document.getElementById(`cancel-${dialogueId}`);
      const closeBtn = document.getElementById(`close-${dialogueId}`);

      const cleanup = () => {
        this.dialogueContainer.classList.add('hidden');
        this.dialogueContainer.innerHTML = '';
        this.currentDialogue = null;
      };

      confirmBtn.addEventListener('click', () => {
        onConfirm();
        cleanup();
        resolve(true);
      });

      cancelBtn.addEventListener('click', () => {
        onCancel();
        cleanup();
        resolve(false);
      });

      closeBtn.addEventListener('click', () => {
        onClose();
        cleanup();
        resolve(false);
      });

      // Close on backdrop click
      this.dialogueContainer.addEventListener('click', (e) => {
        if (e.target === this.dialogueContainer) {
          onClose();
          cleanup();
          resolve(false);
        }
      });

      // Close on Escape key
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          onClose();
          cleanup();
          resolve(false);
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);
    });
  }

  getTypeStyles(type) {
    switch (type) {
      case 'error':
        return {
          icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z',
          iconColor: 'text-red-500',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white'
        };
      case 'success':
        return {
          icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
          iconColor: 'text-green-500',
          confirmButton: 'bg-green-600 hover:bg-green-700 text-white'
        };
      case 'info':
        return {
          icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
          iconColor: 'text-blue-500',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white'
        };
      default: // warning
        return {
          icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z',
          iconColor: 'text-yellow-500',
          confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white'
        };
    }
  }

  // Convenience methods
  async confirm(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
    return await this.showDialogue({
      title,
      message,
      confirmText,
      cancelText,
      type: 'warning'
    });
  }

  async alert(title, message, type = 'info') {
    return await this.showDialogue({
      title,
      message,
      confirmText: 'OK',
      cancelText: '',
      type,
      onCancel: () => {}
    });
  }

  async success(title, message) {
    return await this.alert(title, message, 'success');
  }

  async error(title, message) {
    return await this.alert(title, message, 'error');
  }

  async info(title, message) {
    return await this.alert(title, message, 'info');
  }
}

// Create global instance
window.DialogueSystem = new DialogueSystem();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DialogueSystem;
}
