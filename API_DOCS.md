# WhatsApp Bulk Messaging SaaS API

Complete guide to deploy on Railway and use the bulk messaging API.

## 🚀 Quick Start

### 1. Deploy to Railway

```bash
# Clone/open your project
cd whatsapp-saas

# Login to Railway
railway login

# Link to Railway project
railway link

# Deploy
railway up
```

Or use Railway UI directly:
1. Go to https://railway.app
2. Create new project
3. Connect GitHub repo
4. Set `Start Command`: `node server.js`
5. Deploy

### 2. Environment Variables

Set these in Railway project settings:
```
PORT=3000
NODE_ENV=production
```

## 📡 API Endpoints

### 1. Initialize Bot (Get QR Code)

**Endpoint:** `GET /api/qr/:userId`

Returns a QR code that user scans with their phone's WhatsApp app.

```bash
curl https://your-railway-url.railway.app/api/qr/user123
```

**Response:**
```json
{
  "qr": "data:image/png;base64,...",
  "userId": "user123"
}
```

**Steps:**
1. Call this endpoint
2. Display the QR code to the user
3. User scans with WhatsApp phone app
4. Wait for authentication (15-30 seconds)

---

### 2. Check Connection Status

**Endpoint:** `GET /api/status/:userId`

Check if bot is connected and authenticated.

```bash
curl https://your-railway-url.railway.app/api/status/user123
```

**Response (Connected):**
```json
{
  "status": "connected",
  "userId": "user123",
  "user": {
    "id": "1234567890@s.whatsapp.net",
    "name": "John Doe"
  }
}
```

---

### 3. Send Single Message

**Endpoint:** `POST /api/send`

Send a message to one WhatsApp number.

```bash
curl -X POST https://your-railway-url.railway.app/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "phone": "919876543210",
    "message": "Hello from WhatsApp SaaS!"
  }'
```

**Request Body:**
```json
{
  "userId": "user123",           // User identifier
  "phone": "919876543210",       // Phone number (with country code, no + or spaces)
  "message": "Your message here" // Message text
}
```

**Response:**
```json
{
  "success": true,
  "phone": "919876543210",
  "messageId": 1707308934234
}
```

---

### 4. Send Bulk Messages

**Endpoint:** `POST /api/bulk-send`

Send the same message to multiple contacts at once.

```bash
curl -X POST https://your-railway-url.railway.app/api/bulk-send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "contacts": [
      "919876543210",
      "919876543211",
      "919876543212"
    ],
    "message": "Welcome to our service!"
  }'
```

**Request Body:**
```json
{
  "userId": "user123",
  "contacts": [
    "919876543210",
    "919876543211",
    "919876543212"
  ],
  "message": "Your bulk message here"
}
```

**Response:**
```json
{
  "success": true,
  "total": 3,
  "results": [
    {
      "phone": "919876543210",
      "status": "sent"
    },
    {
      "phone": "919876543211",
      "status": "sent"
    },
    {
      "phone": "919876543212",
      "status": "failed",
      "error": "Invalid number"
    }
  ]
}
```

---

### 5. Health Check

**Endpoint:** `GET /health`

Check if the API is running.

```bash
curl https://your-railway-url.railway.app/health
```

**Response:**
```json
{
  "status": "ok",
  "uptime": 3456.789
}
```

---

## 🔧 Usage Examples

### Node.js / JavaScript

```javascript
const BASE_URL = 'https://your-railway-url.railway.app'
const userId = 'user123'

// 1. Get QR Code
async function getQR() {
  const res = await fetch(`${BASE_URL}/api/qr/${userId}`)
  const data = await res.json()
  console.log('Scan this QR:', data.qr)
}

// 2. Check status
async function checkStatus() {
  const res = await fetch(`${BASE_URL}/api/status/${userId}`)
  const data = await res.json()
  console.log('Status:', data.status)
}

// 3. Send single message
async function sendMessage() {
  const res = await fetch(`${BASE_URL}/api/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: userId,
      phone: '919876543210',
      message: 'Hello World!'
    })
  })
  console.log(await res.json())
}

// 4. Send bulk messages
async function sendBulk() {
  const res = await fetch(`${BASE_URL}/api/bulk-send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: userId,
      contacts: ['919876543210', '919876543211'],
      message: 'Bulk message!'
    })
  })
  console.log(await res.json())
}
```

### Python

```python
import requests
import json

BASE_URL = 'https://your-railway-url.railway.app'
user_id = 'user123'

# Send bulk messages
def send_bulk_messages():
    url = f'{BASE_URL}/api/bulk-send'
    payload = {
        'userId': user_id,
        'contacts': ['919876543210', '919876543211', '919876543212'],
        'message': 'Hello from Python!'
    }
    response = requests.post(url, json=payload)
    print(response.json())

send_bulk_messages()
```

### cURL (Bash)

```bash
#!/bin/bash

BASE_URL="https://your-railway-url.railway.app"
USER_ID="user123"

# Send to multiple numbers
curl -X POST $BASE_URL/api/bulk-send \
  -H "Content-Type: application/json" \
  -d @- << EOF
{
  "userId": "$USER_ID",
  "contacts": ["919876543210", "919876543211"],
  "message": "Hello from Bash!"
}
EOF
```

---

## 📋 Phone Number Format

Always use **international format without symbols**:

| Format | ✅ Correct | ❌ Wrong |
|--------|----------|---------|
| India | `919876543210` | `+91 98765 43210` |
| USA | `12025551234` | `+1 (202) 555-1234` |
| UK | `441632960000` | `+44 (163) 296 0000` |

---

## ⚙️ Architecture

```
Client/Frontend
    ↓
Express.js Server (Railway)
    ↓
Baileys (WhatsApp Web)
    ↓
WhatsApp Servers
    ↓
User's Phone
```

Each `userId` has its own bot instance → multiple users can authenticate simultaneously.

---

## 🔐 Security Notes

- Each user gets their own isolated bot instance
- Credentials stored in `./auth/{userId}/` folder
- On Railway, this data persists in the container volume
- **Important:** Don't expose API publicly without authentication

Add API key authentication:

```javascript
// Middleware (add to server.js)
const API_KEY = process.env.API_KEY
app.use((req, res, next) => {
  if (req.headers['x-api-key'] !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
})
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| QR code not showing | Wait 10 seconds and retry `/api/qr/:userId` |
| "Bot not authenticated" | User hasn't scanned QR code yet |
| Messages not sending | Check phone number format (remove symbols) |
| Bot connection dies | Railway dyno restarted; rescan QR code |

---

## 📊 Rate Limiting

- **Bulk Send:** 1 message per phone per second (built-in delay)
- **Single Send:** No limit
- Adjust delay in `server.js` line: `await new Promise(resolve => setTimeout(resolve, 1000))`

---

## 💡 Next Steps

1. ✅ Deploy to Railway
2. ✅ Test API with `/health`
3. ✅ Get QR code at `/api/qr/testuser`
4. ✅ Scan with WhatsApp
5. ✅ Send test message with `/api/send`
6. ✅ Send bulk messages with `/api/bulk-send`

---

**Questions?** Check Railway logs: `railway logs`
