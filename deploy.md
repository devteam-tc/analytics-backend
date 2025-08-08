# Hostinger Deployment Guide

## Quick Deployment Steps

### 1. Prepare Your Files
Ensure you have the following files ready:
- `analytics.js` (main application)
- `package.json` (dependencies)
- `package-lock.json` (dependency lock file)
- `service-account.json` (Google Analytics credentials)
- `Procfile` (tells Hostinger how to run the app)
- `.gitignore` (excludes sensitive files)

### 2. Set Up Google Analytics
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Analytics Data API
4. Create a service account and download the JSON key
5. Rename the downloaded file to `service-account.json`
6. Place it in your project root

### 3. Deploy to Hostinger

#### Option A: Using Hostinger File Manager
1. Log into your Hostinger control panel
2. Go to "File Manager"
3. Navigate to your domain's public_html directory
4. Upload all project files
5. Set up environment variables (see below)

#### Option B: Using FTP/SFTP
1. Use an FTP client (FileZilla, WinSCP, etc.)
2. Connect to your Hostinger server
3. Upload all files to the public_html directory

### 4. Configure Environment Variables
In your Hostinger control panel:
1. Go to "Advanced" → "Environment Variables"
2. Add these variables:
   ```
   GA_PROPERTY_ID=your_google_analytics_property_id
   GA_KEY_PATH=./service-account.json
   PORT=4000
   NODE_ENV=production
   ```

### 5. Install Dependencies
Hostinger should automatically run `npm install` when it detects the `package.json` file.

### 6. Start the Application
The `Procfile` will automatically start your application using `node analytics.js`.

## Testing Your Deployment

1. **Health Check:**
   ```
   https://your-domain.com/health
   ```

2. **Analytics API:**
   ```
   https://your-domain.com/api/analytics?period=week
   ```

## Troubleshooting

### Common Issues:

1. **"Cannot find module" errors:**
   - Ensure all dependencies are installed
   - Check that `package.json` is uploaded correctly

2. **"Google Analytics credentials not found":**
   - Verify `service-account.json` is uploaded
   - Check `GA_KEY_PATH` environment variable

3. **"Property ID not found":**
   - Verify `GA_PROPERTY_ID` environment variable is set
   - Ensure the property ID is correct

4. **CORS errors:**
   - The app includes CORS middleware
   - If issues persist, check your domain configuration

### Getting Your Google Analytics Property ID:
1. Go to Google Analytics
2. Select your property
3. Go to Admin → Property Settings
4. Copy the Property ID (format: 123456789)

## Security Notes

- Keep your `service-account.json` file secure
- Never commit it to version control
- Use environment variables for sensitive data
- Consider using Hostinger's SSL certificate for HTTPS

## Performance Tips

- The app uses Express.js for optimal performance
- CORS is enabled for cross-origin requests
- Error handling is implemented for robust operation
- Health check endpoint for monitoring 