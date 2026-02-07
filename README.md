# WhatsApp SaaS Bot

A production-ready WhatsApp bot with web interface using Baileys library. Includes QR code scanning and message sending capabilities.

## Features

✅ Web-based QR code display for WhatsApp login  
✅ Send messages via WhatsApp  
✅ Real-time connection status  
✅ Clean, modern dashboard UI  
✅ Runs on Railway, Heroku, or locally  

## Local Development

### Prerequisites
- Node.js 18.x or higher
- npm or yarn

### Installation

```bash
npm install
```

### Running Locally

```bash
npm start
```

Open http://localhost:3000 in your browser and scan the QR code with WhatsApp.

### Development Mode

```bash
npm run dev
```

## Railway Deployment

### 1. Connect Your Repository

```bash
# Initialize git if you haven't already
git init
git add .
git commit -m "Initial commit"
```

### 2. Deploy to Railway

**Option A: Using Railway CLI**

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

**Option B: Using GitHub**

1. Push repo to GitHub
2. Go to [railway.app](https://railway.app)
3. Create new project → Import from GitHub
4. Select your repository
5. Railway will auto-detect Node.js and start deployment

### 3. Configure Environment (if needed)

Add these variables in Railway dashboard under Variables:

```
PORT=3000
NODE_ENV=production
```

## API Endpoints

### GET `/api/qr`
Get current QR code for WhatsApp login

**Response:**
```json
{
  "qr": "data:image/png;base64,...",
  "ready": false,
  "status": "qr_ready"
}
```

### GET `/api/status`
Get current connection status

**Response:**
```json
{
  "connected": true,
  "status": "connected",
  "hasQR": false
}
```

### POST `/api/send`
Send a message

**Request:**
```json
{
  "number": "+919876543210",
  "message": "Hello!"
}
```

**Response:**
```json
{
  "ok": true,
  "msg": "Message sent"
}
```

### POST `/api/logout`
Logout from WhatsApp

**Response:**
```json
{
  "ok": true,
  "msg": "Logged out successfully"
}
```

### GET `/api/health`
Health check endpoint

**Response:**
```json
{
  "ok": true,
  "status": "connected"
}
```

## Project Structure

```
whatsapp-saas/
├── index.js              # Main server file
├── public/
│   └── index.html        # Dashboard UI
├── auth/                 # WhatsApp session storage
├── package.json          # Dependencies
├── Procfile              # Process file for deployment
├── railway.json          # Railway configuration
└── .gitignore           # Files to ignore in git
```

## Troubleshooting

### QR Code Not Displaying
- Check browser console for errors
- Ensure server is running: `npm start`
- Verify port 3000 is accessible

### Cannot Connect to WhatsApp
- Delete the `auth/` folder to reset connection
- Restart the server
- Ensure you have a valid WhatsApp account

### Railway Deployment Issues
- Check Railway logs: `railway logs`
- Verify Node.js version is 18.x or higher
- Ensure all environment variables are set

## License

ISC
