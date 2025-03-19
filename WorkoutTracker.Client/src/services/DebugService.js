// Debug Service for tracking logs across page reloads and redirects
class DebugService {
  constructor() {
    this.maxLogEntries = 100;
    this.logStorageKey = 'workout_tracker_debug_logs';
  }

  // Get all stored logs
  getLogs() {
    try {
      const logs = localStorage.getItem(this.logStorageKey);
      return logs ? JSON.parse(logs) : [];
    } catch (e) {
      console.error('Error parsing debug logs:', e);
      return [];
    }
  }

  // Add a new log entry
  log(category, message, data = null) {
    try {
      const logs = this.getLogs();
      const timestamp = new Date().toISOString();
      
      logs.push({
        timestamp,
        category,
        message,
        data: data ? JSON.stringify(data) : null
      });

      // Limit the number of logs stored
      if (logs.length > this.maxLogEntries) {
        logs.splice(0, logs.length - this.maxLogEntries);
      }

      localStorage.setItem(this.logStorageKey, JSON.stringify(logs));
      
      // Also output to console
      console.log(`[${category}] ${message}`, data || '');
    } catch (e) {
      console.error('Error storing debug log:', e);
    }
  }

  // Clear all logs
  clearLogs() {
    localStorage.removeItem(this.logStorageKey);
  }

  // Log authentication related events
  logAuth(message, data = null) {
    this.log('AUTH', message, data);
  }

  // Log API related events
  logApi(message, data = null) {
    this.log('API', message, data);
  }

  // Log navigation events
  logNavigation(message, data = null) {
    this.log('NAVIGATION', message, data);
  }
}

// Create a singleton instance
const debugService = new DebugService();

export default debugService; 