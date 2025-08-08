const express = require('express');
const router = express.Router();
const { validateDateParams, buildAnalyticsRequest, processResponseRows } = require('../utils/helpers');

module.exports = (analyticsDataClient, propertyId) => {
  router.get('/', async (req, res) => {
    try {
      const { startDate, endDate, dimension = 'sessionSource', filter, metrics } = req.query;
      validateDateParams(startDate, endDate);
      // Default metrics for traffic acquisition
      const defaultMetrics = ['sessions', 'activeUsers', 'engagedSessions', 'engagementRate', 'eventCount', 'bounceRate'];
      const metricsArr = metrics ? metrics.split(',') : defaultMetrics;
      const dimensionsArr = [dimension];
      
      let dimensionFilter;
      if (filter) {
        const [key, value] = filter.split('=');
        dimensionFilter = {
          filter: { fieldName: dimension, stringFilter: { value } }
        };
      }
      
      const [response] = await analyticsDataClient.runReport(
        buildAnalyticsRequest(propertyId, startDate, endDate, metricsArr, dimensionsArr, dimensionFilter)
      );
      
      const result = processResponseRows(response.rows, metricsArr, dimensionsArr);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  return router;
}; 