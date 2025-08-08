const express = require('express');
const router = express.Router();
const { validateDateParams, buildAnalyticsRequest, processResponseRows } = require('../utils/helpers');

module.exports = (analyticsDataClient, propertyId) => {
  router.get('/', async (req, res) => {
    try {
      const { startDate, endDate, dimension = 'firstUserSource', filter, metrics } = req.query;
      validateDateParams(startDate, endDate);
      // Default metrics for user acquisition
      const defaultMetrics = ['activeUsers', 'newUsers', 'engagedSessions', 'engagementRate', 'eventCount', 'bounceRate'];
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

  // Analytics summary endpoint
  router.get('/summary', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      // Default to last 28 days if not provided
      const today = new Date();
      const defaultEnd = today.toISOString().split('T')[0];
      const defaultStart = new Date(today);
      defaultStart.setDate(defaultStart.getDate() - 27); // 28 days including today
      const usedStart = startDate || defaultStart.toISOString().split('T')[0];
      const usedEnd = endDate || defaultEnd;
      validateDateParams(usedStart, usedEnd);

      // Metrics: sessions, userEngagementDuration, active users, bounce rate
      // Use only valid GA4 API metric names
      const metrics = [
        'sessions',
        'userEngagementDuration',
        'activeUsers',
        'bounceRate'
      ];
      const dimensions = [];
      const [mainResponse] = await analyticsDataClient.runReport(
        buildAnalyticsRequest(propertyId, usedStart, usedEnd, metrics, dimensions)
      );
      const mainRow = mainResponse.rows?.[0]?.metricValues || [];
      const sessions = parseInt(mainRow[0]?.value || '0');
      const avgEngagementTime = parseFloat(mainRow[1]?.value || '0');
      const activeUsers = parseInt(mainRow[2]?.value || '0');
      const bounceRate = parseFloat(mainRow[3]?.value || '0');
      const avgEngagementPerUser = activeUsers > 0 ? avgEngagementTime / activeUsers : 0;

      // Key events (top 5 by eventCount)
      const eventMetrics = ['eventCount'];
      const eventDimensions = ['eventName'];
      const [eventResponse] = await analyticsDataClient.runReport(
        buildAnalyticsRequest(propertyId, usedStart, usedEnd, eventMetrics, eventDimensions)
      );
      const keyEvents = (eventResponse.rows || [])
        .map(row => ({
          eventName: row.dimensionValues[0].value,
          eventCount: parseInt(row.metricValues[0].value)
        }))
        .sort((a, b) => b.eventCount - a.eventCount)
        .slice(0, 5);

      // Sum of eventCount for all keyEvents
      const totalKeyEvents = keyEvents.reduce((sum, ev) => sum + ev.eventCount, 0);

      res.json({
        sessions,
        averageEngagementTimePerActiveUser: avgEngagementPerUser,
        bounceRate,
        keyEvents,
        totalKeyEvents,
        startDate: usedStart,
        endDate: usedEnd
      });
    } catch (err) {
      // Enhanced error logging for debugging
      console.error('GA API Error:', err);
      try {
        console.error('Request Params:', {
          startDate: typeof usedStart !== 'undefined' ? usedStart : req.query.startDate,
          endDate: typeof usedEnd !== 'undefined' ? usedEnd : req.query.endDate,
          metrics: typeof metrics !== 'undefined' ? metrics : undefined,
          dimensions: typeof dimensions !== 'undefined' ? dimensions : undefined
        });
      } catch (e) {
        console.error('Error logging request params:', e);
      }
      if (err.details) console.error('Details:', err.details);
      res.status(500).json({ error: err.message, details: err.details || null });
    }
  });
  return router;
};