// Helper function to format date offset
const formatDateOffset = (date = new Date(), monthOffset = -1) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + monthOffset);
  return d.toISOString().split('T')[0];
};

// Helper function to build analytics request
const buildAnalyticsRequest = (propertyId, startDate, endDate, metrics, dimensions, dimensionFilter) => ({
  property: `properties/${propertyId}`,
  dateRanges: [{ startDate, endDate }],
  metrics: metrics.map(m => ({ name: m })),
  dimensions: dimensions.map(d => ({ name: d })),
  ...(dimensionFilter && { dimensionFilter })
});

// Helper function to process response rows
const processResponseRows = (rows, metrics, dimensions) => {
  return rows.map(row => {
    const dimObj = {};
    row.dimensionValues.forEach((v, i) => {
      dimObj[dimensions[i]] = v.value;
    });
    const metricObj = {};
    row.metricValues.forEach((v, i) => {
      metricObj[metrics[i]] = v.value;
    });
    return { ...dimObj, ...metricObj };
  });
};

// Helper function to validate date parameters
const validateDateParams = (startDate, endDate) => {
  if (!startDate || !endDate) {
    throw new Error('startDate and endDate are required in YYYY-MM-DD format.');
  }
};

// Helper function to create dimension filter from query parameters
const createDimensionFilter = (filters) => {
  if (Object.keys(filters).length === 0) return undefined;
  
  return {
    andGroup: {
      expressions: Object.entries(filters).map(([key, value]) => ({
        filter: { fieldName: key, stringFilter: { value } }
      }))
    }
  };
};

module.exports = {
  formatDateOffset,
  buildAnalyticsRequest,
  processResponseRows,
  validateDateParams,
  createDimensionFilter
}; 