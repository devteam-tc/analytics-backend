# Quick Firebase Deployment Guide

## Prerequisites

1. **Google Analytics Service Account Key**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a service account and download the JSON key
   - Save it as `service-account.json` in your project root

2. **Google Analytics Property ID**
   - Go to Google Analytics → Admin → Property Settings
   - Copy the Property ID (format: 123456789)

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name it (e.g., "analytics-backend")
4. Copy the project ID

## Step 2: Update Project Configuration

Edit `.firebaserc` and replace the project ID:
```json
{
  "projects": {
    "default": "YOUR_ACTUAL_PROJECT_ID"
  }
}
```

## Step 3: Set Environment Variables

```bash
# Set your Google Analytics Property ID
firebase functions:config:set analytics.property_id="YOUR_GA_PROPERTY_ID"

# Set the path to your service account key
firebase functions:config:set analytics.key_path="./service-account.json"
```

## Step 4: Deploy

```bash
# Option 1: Use the deployment script
node deploy-firebase.js

# Option 2: Manual deployment
npm run deploy
```

## Step 5: Test Your API

Your API will be available at:
- **Health Check**: `https://your-project-id.web.app/health`
- **Analytics API**: `https://your-project-id.web.app/api/analytics?period=week`

## Example API Calls

```bash
# Health check
curl https://your-project-id.web.app/health

# Get analytics for the last week
curl https://your-project-id.web.app/api/analytics?period=week

# Get analytics with custom metrics
curl "https://your-project-id.web.app/api/analytics?period=week&metric=activeUsers,sessions&dimensions=date,deviceCategory"
```

## Troubleshooting

### If you get "Project not found":
- Update `.firebaserc` with your correct project ID
- Run `firebase use your-project-id`

### If you get "Service account not found":
- Ensure `service-account.json` is in the project root
- Check the file permissions

### If you get "Property ID not found":
- Verify your Google Analytics Property ID
- Check Firebase config: `firebase functions:config:get`

## Local Development

```bash
# Start Firebase emulator
npm run dev

# In another terminal, start ngrok
ngrok http 5001
```

Your local API will be available at the ngrok URL! 