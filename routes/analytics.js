const express = require('express');
const router = express.Router();
const { 
  formatDateOffset, 
  buildAnalyticsRequest, 
  processResponseRows, 
  validateDateParams, 
  createDimensionFilter 
} = require('../utils/helpers');

module.exports = (analyticsDataClient, propertyId) => {
  // User activity summary endpoint with custom date range
  router.get('/user-activity-summary', async (req, res) => {
    try {
      const { startDate, endDate = 'today' } = req.query;
      
      if (!startDate) {
        return res.status(400).json({ error: 'startDate query parameter is required' });
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(startDate) || (endDate !== 'today' && !dateRegex.test(endDate))) {
        return res.status(400).json({ error: 'Dates must be in YYYY-MM-DD format' });
      }

      const [response] = await analyticsDataClient.runReport(
        buildAnalyticsRequest(propertyId, startDate, endDate, ['activeUsers'], ['date'])
      );
      
      const activityData = processResponseRows(response.rows, ['activeUsers'], ['date'])
        .map(row => ({
          date: row.date,
          activeUsers: parseInt(row.activeUsers)
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      res.json(activityData);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Totals endpoint with custom date range
  router.get('/totals', async (req, res) => {
    try {
      const { startDate = '2024-03-01', endDate = 'today' } = req.query;
      const metrics = ['screenPageViews', 'totalUsers', 'sessions', 'eventCount'];
      
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if ((startDate !== '2024-03-01' && !dateRegex.test(startDate)) || 
          (endDate !== 'today' && !dateRegex.test(endDate))) {
        return res.status(400).json({ error: 'Dates must be in YYYY-MM-DD format' });
      }

      const [response] = await analyticsDataClient.runReport(
        buildAnalyticsRequest(propertyId, startDate, endDate, metrics, [])
      );

      const row = response.rows?.[0]?.metricValues || [];
      res.json({
        totalViews: row[0]?.value || '0',
        totalUsers: row[1]?.value || '0',
        totalSessions: row[2]?.value || '0',
        totalEvents: row[3]?.value || '0',
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Page views endpoint
  router.get('/page-views', async (req, res) => {
    try {
      const [response] = await analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '2025-03-01', endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 50
      });

      const result = response.rows.map(row => ({
        pagePath: row.dimensionValues[0].value,
        views: parseInt(row.metricValues[0].value)
      }));

      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // General analytics endpoint
  router.get('/', async (req, res) => {
    try {
      const { period, metric, dimensions } = req.query;
      const now = new Date();
      
      const periodMap = {
        day: '1daysAgo',
        week: '7daysAgo',
        month: formatDateOffset(now, -1),
        '1m': formatDateOffset(now, -1),
        '3m': formatDateOffset(now, -3),
        '6m': formatDateOffset(now, -6)
      };
      
      const startDate = periodMap[period] || '7daysAgo';
      const metrics = (metric ? metric.split(',') : ['activeUsers']);
      const dims = (dimensions ? dimensions.split(',') : ['date']);

      const [response] = await analyticsDataClient.runReport(
        buildAnalyticsRequest(propertyId, startDate, 'today', metrics, dims)
      );

      const result = processResponseRows(response.rows, metrics, dims);
      result.sort((a, b) => a.date?.localeCompare(b.date));
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Custom analytics endpoint
  router.get('/custom', async (req, res) => {
    try {
      const { startDate, endDate, ...filters } = req.query;
      validateDateParams(startDate, endDate);

      const metrics = ['activeUsers', 'newUsers', 'sessions', 'bounceRate', 'eventCount'];
      const dimensions = ['date'];
      const dimensionFilter = createDimensionFilter(filters);

      const [response] = await analyticsDataClient.runReport(
        buildAnalyticsRequest(propertyId, startDate, endDate, metrics, dimensions, dimensionFilter)
      );

      const result = response.rows.map(row => {
        const obj = { date: row.dimensionValues[0].value };
        row.metricValues.forEach((val, i) => {
          obj[metrics[i]] = val.value;
        });
        return obj;
      });

      result.sort((a, b) => a.date.localeCompare(b.date));
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Event count by event name endpoint
  router.get('/event-count-by-name', async (req, res) => {
    try {
      let { startDate, endDate } = req.query;
      // If neither provided, default to yesterday for both
      if (!startDate && !endDate) {
        startDate = endDate = formatDateOffset(new Date(), 0); // yesterday
      } else if (startDate && !endDate) {
        endDate = startDate;
      } else if (!startDate && endDate) {
        startDate = endDate;
      }
      const metrics = ['eventCount'];
      const dimensions = ['eventName'];
      const [response] = await analyticsDataClient.runReport(
        buildAnalyticsRequest(propertyId, startDate, endDate, metrics, dimensions)
      );
      const result = processResponseRows(response.rows, metrics, dimensions)
        .map(row => ({
          eventName: row.eventName,
          eventCount: parseInt(row.eventCount)
        }))
        .sort((a, b) => b.eventCount - a.eventCount);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Analytics by page title endpoint
  router.get('/page-title-analytics', async (req, res) => {
    try {
      const { startDate = '2024-03-01', endDate = 'today' } = req.query;
      const metrics = ['screenPageViews', 'activeUsers', 'eventCount', 'bounceRate', 'userEngagementDuration'];
      const dimensions = ['pageTitle'];
      const [response] = await analyticsDataClient.runReport(
        buildAnalyticsRequest(propertyId, startDate, endDate, metrics, dimensions)
      );
      const result = response.rows.map(row => {
        const views = parseInt(row.metricValues[0].value);
        const activeUsers = parseInt(row.metricValues[1].value);
        return {
          pageTitle: row.dimensionValues[0].value,
          views,
          activeUsers,
          eventCount: parseInt(row.metricValues[2].value),
          bounceRate: parseFloat(row.metricValues[3].value),
          bounceRateFormatted: (parseFloat(row.metricValues[3].value) * 100).toFixed(1) + '%',
          viewsPerActiveUser: activeUsers > 0 ? +(views / activeUsers).toFixed(2) : 0,
          avgEngagementTimePerUser: activeUsers > 0 ? 
            Math.round(parseFloat(row.metricValues[4].value) / activeUsers) : 0
        };
      });
      // Sort descending by views
      result.sort((a, b) => b.views - a.views);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Country-wise active users endpoint
  router.get('/country-active-users', async (req, res) => {
    try {
      let { startDate, endDate } = req.query;
      // By default, use yesterday for both if not provided
      if (!startDate && !endDate) {
        const yesterday = formatDateOffset(new Date(), 0);
        startDate = yesterday;
        endDate = yesterday;
      } else if (startDate && !endDate) {
        endDate = startDate;
      } else if (!startDate && endDate) {
        startDate = endDate;
      }
      const metrics = ['activeUsers'];
      const dimensions = ['country'];
      const [response] = await analyticsDataClient.runReport(
        buildAnalyticsRequest(propertyId, startDate, endDate, metrics, dimensions)
      );
      const result = response.rows.map(row => ({
        country: row.dimensionValues[0].value,
        activeUsers: parseInt(row.metricValues[0].value)
      })).sort((a, b) => b.activeUsers - a.activeUsers);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}; 