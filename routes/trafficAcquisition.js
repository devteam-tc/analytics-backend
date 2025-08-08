const express = require('express');
const router = express.Router();
const { validateDateParams, buildAnalyticsRequest, processResponseRows } = require('../utils/helpers');

module.exports = (analyticsDataClient, propertyId) => {
  router.get('/', async (req, res) => {
    try {
      let { startDate, endDate, dimension = 'sessionSource', filter, metrics } = req.query;
      // Default to last 28 days if no startDate or endDate is provided
      if (!startDate || !endDate) {
        const today = new Date(); // Use current date dynamically
        const priorDate = new Date(today);
        priorDate.setDate(today.getDate() - 27); // 28 days including today
        startDate = priorDate.toISOString().slice(0, 10);
        endDate = today.toISOString().slice(0, 10);
      }
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

      // Calculate totals for all metrics
      const totals = {};
      metricsArr.forEach(metric => {
        totals[metric] = result.reduce((sum, row) => sum + (parseFloat(row[metric]) || 0), 0);
      });

      res.json({
        rows: result,
        totals
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  return router;
}; 