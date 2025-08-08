# Firebase Deployment Guide

## Why Firebase?

Firebase is the **best choice** for your analytics backend because:
- ✅ **Free tier**: 125K invocations/month, 40K GB-seconds compute time
- ✅ **Perfect for Node.js APIs**: Cloud Functions work great with Express
- ✅ **Google Analytics integration**: Native Google services integration
- ✅ **Automatic scaling**: Handles traffic spikes well
- ✅ **Global CDN**: Fast response times worldwide

## Prerequisites

1. **Google Account** (same as your Google Analytics)
2. **Node.js** (version 18 or higher)
3. **Google Analytics Property ID**
4. **Google Analytics Service Account Key**

## Step-by-Step Deployment

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

### 3. Initialize Firebase Project

```bash
firebase init
```

**Select the following options:**
- Choose "Functions" and "Hosting"
- Select "Create a new project" or use existing
- Choose "JavaScript" for Functions
- Say "No" to ESLint
- Say "Yes" to installing dependencies

### 4. Set Up Google Analytics

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Analytics Data API
4. Create a service account and download the JSON key
5. Rename the downloaded file to `service-account.json`
6. Place it in your project root

### 5. Configure Environment Variables

Set up Firebase environment variables:

```bash
# Set Google Analytics Property ID
firebase functions:config:set analytics.property_id="YOUR_GA_PROPERTY_ID"

# Set the path to your service account key
firebase functions:config:set analytics.key_path="./service-account.json"
```

### 6. Update Your Code for Firebase

The code has been updated to work with Firebase. Key changes:
- `index.js` - Firebase Cloud Function entry point
- `firebase.json` - Firebase configuration
- `analytics.js` - Modified to export the Express app

### 7. Deploy to Firebase

```bash
firebase deploy
```

This will deploy both your functions and hosting.

### 8. Test Your Deployment

Your API will be available at:
- **Health Check**: `https://your-project-id.web.app/health`
- **Analytics API**: `https://your-project-id.web.app/api/analytics?period=week`

## Environment Variables in Firebase

Firebase uses a different method for environment variables. Update your `analytics.js` to use Firebase config:

```javascript
// In analytics.js, replace the environment variable access:
const propertyId = functions.config().analytics.property_id;
const keyPath = functions.config().analytics.key_path;
```

## Firebase Free Tier Limits

- **125,000 invocations per month**
- **40,000 GB-seconds of compute time**
- **5GB of storage**
- **10GB of data transfer**

For most analytics APIs, this is more than sufficient.

## Monitoring and Logs

View your function logs:
```bash
firebase functions:log
```

Monitor usage in Firebase Console:
1. Go to Firebase Console
2. Select your project
3. Go to Functions → Usage

## Troubleshooting

### Common Issues:

1. **"Cannot find module" errors:**
   - Run `npm install` in the functions directory
   - Ensure all dependencies are in `package.json`

2. **"Google Analytics credentials not found":**
   - Verify `service-account.json` is uploaded
   - Check Firebase config variables

3. **"Property ID not found":**
   - Verify Firebase config is set correctly
   - Use `firebase functions:config:get` to check

4. **Function timeout:**
   - Firebase Functions have a 60-second timeout (free tier)
   - Your analytics calls should complete well within this

## Cost Optimization

- **Free tier**: 125K invocations/month
- **Paid tier**: $0.40 per million invocations
- **Compute time**: $0.0025 per GB-second

For typical analytics usage, you'll likely stay within the free tier.

## Security

- Firebase automatically handles HTTPS
- Service account keys are secure in Firebase environment
- No need to expose credentials in code

## Next Steps

1. Deploy your application
2. Test the endpoints
3. Monitor usage in Firebase Console
4. Set up alerts if needed

Your analytics backend will be globally available, scalable, and cost-effective! 