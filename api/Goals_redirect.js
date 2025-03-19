// This file handles requests to /api/Goals and forwards them to the lowercase goals.js implementation
const goalsHandler = require('./goals');

module.exports = (req, res) => {
  console.log(`Received ${req.method} request to /api/Goals via redirect handler`);
  console.log('URL path:', req.url);
  
  // Simply forward to the main goals.js handler
  return goalsHandler(req, res);
}; 