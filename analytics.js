const express = require('express');
const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const cors = require('cors');

// Load environment variables
require('dotenv').config();

if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  const fs = require('fs');
  const path = require('path');
  const credsPath = path.join('/tmp', 'gcp-creds.json');
  fs.writeFileSync(credsPath, process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credsPath;
}

const app = express();
app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get configuration and initialize analytics client
const { getConfig } = require('./utils/config');
const config = getConfig();
const analyticsDataClient = new BetaAnalyticsDataClient({ keyFilename: config.keyPath });

// Import and use route modules
const analyticsRouter = require('./routes/analytics')(analyticsDataClient, config.propertyId);
const userAcquisitionRouter = require('./routes/userAcquisition')(analyticsDataClient, config.propertyId);
const trafficAcquisitionRouter = require('./routes/trafficAcquisition')(analyticsDataClient, config.propertyId);

app.use('/api/analytics', analyticsRouter);
app.use('/api/analytics/user-acquisition', userAcquisitionRouter);
app.use('/api/analytics/traffic-acquisition', trafficAcquisitionRouter);

const PORT = process.env.PORT || 4000;

// Only start the server if this file is run directly (not imported)
if (require.main === module) {
  app.listen(PORT, () => console.log(`Analytics API running on port ${PORT}`));
}

// Export the Express app for Firebase Functions
module.exports = app;