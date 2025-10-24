# Analytics Backend Setup Guide

## Issue Identified
The `/api/analytics` endpoint is not working due to missing Google Analytics authentication credentials.

## Quick Fix

### 1. Create Environment File
Create a `.env` file in the project root with the following content:

```env
# Google Analytics Property ID (get this from Google Analytics)
GA_PROPERTY_ID=your_property_id_here

# Path to your Google Analytics service account key file
GA_KEY_PATH=./path/to/your/service-account-key.json

# Server port (optional)
PORT=4000
```

### 2. Get Google Analytics Credentials

#### Option A: Service Account Key File
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Analytics Reporting API
4. Go to "Credentials" → "Create Credentials" → "Service Account"
5. Download the JSON key file
6. Place it in your project directory
7. Update `GA_KEY_PATH` in `.env` to point to this file

#### Option B: JSON Credentials (for deployment)
1. Get the service account JSON content
2. Set it as an environment variable:
```env
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"..."}
```

### 3. Get Google Analytics Property ID
1. Go to [Google Analytics](https://analytics.google.com/)
2. Select your property
3. Go to Admin → Property Settings
4. Copy the Property ID (numeric value)

### 4. Test the Setup
```bash
# Check configuration
curl http://localhost:4000/config-check

# Test analytics endpoint
curl http://localhost:4000/api/analytics
```

## Available Endpoints

- `GET /health` - Health check
- `GET /config-check` - Configuration status
- `GET /api/analytics` - General analytics data
- `GET /api/analytics/totals` - Summary totals
- `GET /api/analytics/page-views` - Page views data
- `GET /api/analytics/user-activity-summary` - User activity
- `GET /api/analytics/custom` - Custom analytics queries

## Troubleshooting

### Common Issues:
1. **"Could not load the default credentials"** - Missing or invalid Google Analytics credentials
2. **"Property ID not found"** - Invalid GA_PROPERTY_ID
3. **"Permission denied"** - Service account doesn't have access to the Analytics property

### Solutions:
1. Verify your service account has access to Google Analytics
2. Ensure the property ID is correct
3. Check that the key file path is correct
4. For deployment, use `GOOGLE_APPLICATION_CREDENTIALS_JSON` instead of file path
