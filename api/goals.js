// This file resolves the circular reference issue by using a shared implementation
// Import the actual implementation
const goalsImplementation = require('./lowercase-goals.js');

// Export the implementation
module.exports = goalsImplementation; 