// Redirect for /api/Goals (capital G) to correctly route to the Goals.js handler
module.exports = (req, res) => {
  console.log('Redirecting from Goals_redirect.js to Goals.js');
  // Simply forward the request to the Goals.js handler
  const goalsHandler = require('./Goals.js');
  return goalsHandler(req, res);
}; 