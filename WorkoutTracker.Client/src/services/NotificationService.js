/**
 * NotificationService for managing app notifications
 * This service will be used by the Vuex store to show messages to the user
 */
class NotificationService {
  constructor() {
    this.store = null;
  }
  
  /**
   * Initialize the service with a Vuex store
   * @param {Object} store - The Vuex store
   */
  init(store) {
    this.store = store;
  }
  
  /**
   * Show a success message
   * @param {string} message - The message to display
   * @param {number} timeout - Duration in milliseconds to show the message (default: 5000)
   */
  showSuccess(message, timeout = 5000) {
    if (!this.store) throw new Error('NotificationService not initialized with a store');
    
    this.store.dispatch('showMessage', {
      message,
      type: 'success',
      timeout
    });
  }
  
  /**
   * Show an error message
   * @param {string} message - The error message to display
   * @param {number} timeout - Duration in milliseconds to show the message (default: 8000)
   */
  showError(message, timeout = 8000) {
    if (!this.store) throw new Error('NotificationService not initialized with a store');
    
    this.store.dispatch('showMessage', {
      message,
      type: 'error',
      timeout
    });
  }
  
  /**
   * Show a warning message
   * @param {string} message - The warning message to display
   * @param {number} timeout - Duration in milliseconds to show the message (default: 6000)
   */
  showWarning(message, timeout = 6000) {
    if (!this.store) throw new Error('NotificationService not initialized with a store');
    
    this.store.dispatch('showMessage', {
      message,
      type: 'warning',
      timeout
    });
  }
  
  /**
   * Show an info message
   * @param {string} message - The info message to display
   * @param {number} timeout - Duration in milliseconds to show the message (default: 4000)
   */
  showInfo(message, timeout = 4000) {
    if (!this.store) throw new Error('NotificationService not initialized with a store');
    
    this.store.dispatch('showMessage', {
      message,
      type: 'info',
      timeout
    });
  }
}

// Create a singleton instance
const notificationService = new NotificationService();

export default notificationService; 