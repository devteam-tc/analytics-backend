# Analytics Backend

A Node.js Express server that provides Google Analytics data through a REST API.

## Features

- Google Analytics data integration
- RESTful API endpoints
- CORS enabled
- Configurable time periods (day, week, month)

## API Endpoints

- `GET /api/analytics?period=day|week|month` - Get analytics data for specified period

## Environment Variables

Create a `.env` file with the following variables:

```
GA_PROPERTY_ID=your_google_analytics_property_id
GA_KEY_PATH=./service-account.json
PORT=4000
NODE_ENV=production
```

## Deployment to Hostinger

### Prerequisites

1. Google Analytics service account key file (`service-account.json`)
2. Google Analytics Property ID
3. Hostinger hosting account

### Steps

1. **Prepare your Google Analytics credentials:**
   - Download your service account key from Google Cloud Console
   - Rename it to `service-account.json`
   - Place it in the project root

2. **Set up environment variables in Hostinger:**
   - Go to your Hostinger control panel
   - Navigate to "Advanced" → "Environment Variables"
   - Add the following variables:
     - `GA_PROPERTY_ID`: Your Google Analytics Property ID
     - `GA_KEY_PATH`: `./service-account.json`
     - `PORT`: `4000` (or your preferred port)
     - `NODE_ENV`: `production`

3. **Upload files to Hostinger:**
   - Upload all project files to your hosting directory
   - Ensure `service-account.json` is uploaded to the root directory

4. **Install dependencies:**
   - Hostinger will automatically run `npm install` based on the `package.json`

5. **Start the application:**
   - The `Procfile` will tell Hostinger to run `node analytics.js`

## Local Development

```bash
npm install
npm start
```

The server will run on `http://localhost:4000`

## API Usage

```bash
# Get analytics for the last day
curl "https://your-domain.com/api/analytics?period=day"

# Get analytics for the last week
curl "https://your-domain.com/api/analytics?period=week"

# Get analytics for the last month
curl "https://your-domain.com/api/analytics?period=month"
```

## Response Format

```json
[
  {
    "date": "20231201",
    "users": "123"
  },
  {
    "date": "20231202", 
    "users": "145"
  }
]
``` 