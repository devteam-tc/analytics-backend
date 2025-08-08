const express = require('express');
const router = express.Router();
const { validateDateParams, buildAnalyticsRequest, processResponseRows } = require('../utils/helpers');

module.exports = (analyticsDataClient, propertyId) => {
  router.get('/', async (req, res) => {
    try {
      let { startDate, endDate, dimensions, filter, metrics } = req.query;
      // Default to last 28 days if no startDate or endDate is provided
      if (!startDate || !endDate) {
        const today = new Date(); // Use current date dynamically
        const priorDate = new Date(today);
        priorDate.setDate(today.getDate() - 27); // 28 days including today
        startDate = priorDate.toISOString().slice(0, 10);
        endDate = today.toISOString().slice(0, 10);
      }
      validateDateParams(startDate, endDate);
      // Default metrics for traffic acquisition (as requested)
      const defaultMetrics = [
        'totalUsers',
        'newUsers',
        'engagedSessions',
        'averageSessionDuration',
        'eventCount',
        'keyEvents'
      ];
      // Always include all default metrics, even if custom ones are provided
      let metricsArr = metrics ? Array.from(new Set([...metrics.split(','), ...defaultMetrics])) : defaultMetrics;
      // Default dimensions: pagePath, pageTitle, and sessionSource
      let dimensionsArr = dimensions ? Array.from(new Set([...dimensions.split(','), 'pagePath', 'pageTitle', 'sessionSource'])) : ['pagePath', 'pageTitle', 'sessionSource'];
      
      let dimensionFilter;
      if (filter) {
        // Support filtering on any dimension
        const filters = {};
        filter.split(',').forEach(f => {
          const [key, value] = f.split('=');
          if (key && value) filters[key] = value;
        });
        if (Object.keys(filters).length > 0) {
          dimensionFilter = require('../utils/helpers').createDimensionFilter(filters);
        }
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