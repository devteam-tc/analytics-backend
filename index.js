const functions = require('firebase-functions');
const app = require('./analytics');



// Export the Express app as a Firebase Cloud Function
exports.analytics = functions.https.onRequest(app); 