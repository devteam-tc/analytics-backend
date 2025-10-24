const express = require('express');
const router = express.Router();
const { validateDateParams, buildAnalyticsRequest, processResponseRows } = require('../utils/helpers');

// Common traffic sources to track in the summary
const COMMON_SOURCES = [
  'google',
  'facebook',
  'direct',
  'organic',
  'referral',
  'email',
  'social',
  'localhost',
  '(not set)'
];

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

      // Generate traffic source summary
      const summary = { total: { ...totals } };
      
      // Initialize all common sources with zero values
      COMMON_SOURCES.forEach(source => {
        summary[source] = metricsArr.reduce((acc, metric) => {
          acc[metric] = 0;
          return acc;
        }, {});
      });
      
      // Aggregate metrics by source
      result.forEach(row => {
        const source = (row.sessionSource || '').toLowerCase();
        const targetSource = COMMON_SOURCES.find(s => source.includes(s)) || 'other';
        
        if (!summary[targetSource]) {
          summary[targetSource] = metricsArr.reduce((acc, metric) => {
            acc[metric] = 0;
            return acc;
          }, {});
        }
        
        metricsArr.forEach(metric => {
          if (row[metric]) {
            summary[targetSource][metric] = (summary[targetSource][metric] || 0) + (parseFloat(row[metric]) || 0);
          }
        });
      });
      
      // Convert to array and sort by totalUsers descending
      const summaryArray = Object.entries(summary)
        .map(([source, metrics]) => ({
          source: source === 'total' ? 'Total' : source.charAt(0).toUpperCase() + source.slice(1),
          ...metrics
        }))
        .sort((a, b) => b.totalUsers - a.totalUsers);
      
      // Take top 8 + total
      const topSources = [
        ...summaryArray.filter(item => item.source === 'Total'),
        ...summaryArray
          .filter(item => item.source !== 'Total')
          .slice(0, 7)
      ];
      
      res.json({
        rows: result,
        totals,
        summary: topSources
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  return router;
}; 