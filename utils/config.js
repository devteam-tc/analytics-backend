// Get configuration from Firebase or environment variables
const getConfig = () => {
  try {
    // Try Firebase config first
    const { functions } = require('firebase-functions');
    const config = functions.config();
    return {
      propertyId: config.analytics?.property_id || process.env.GA_PROPERTY_ID,
      keyPath: config.analytics?.key_path || process.env.GA_KEY_PATH
    };
  } catch (error) {
    // Fallback to environment variables
    return {
      propertyId: process.env.GA_PROPERTY_ID,
      keyPath: process.env.GA_KEY_PATH
    };
  }
};

module.exports = { getConfig }; 