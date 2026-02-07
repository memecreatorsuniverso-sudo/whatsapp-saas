const express = require('express')
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const QRCode = require('qrcode')
const fs = require('fs')
const path = require('path')

const app = express()
app.use(express.json())

const PORT = process.env.PORT || 3000
const botsMap = new Map() // Store bot instances per user

// Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// Initialize a bot for a user
async function initializeBot(userId) {
  if (botsMap.has(userId)) {
    return botsMap.get(userId)
  }

  const authPath = path.join(__dirname, `./auth/${userId}`)
  const { state, saveCreds } = await useMultiFileAuthState(authPath)

  const sock = makeWASocket({
    auth: state,
    printQR: false,
  })

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log(`[${userId}] QR Generated - scan to authenticate`)
      sock.qr = qr
    }

    if (connection === 'open') {
      console.log(`[${userId}] ✅ Connected to WhatsApp`)
    }

    if (connection === 'close') {
      console.log(`[${userId}] Connection closed, reconnecting...`)
      botsMap.delete(userId)
    }
  })

  sock.ev.on('creds.update', saveCreds)

  botsMap.set(userId, sock)
  return sock
}

// GET QR Code
app.get('/api/qr/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const sock = await initializeBot(userId)

    if (!sock.qr) {
      return res.status(400).json({ error: 'No QR code available. Try again in a few seconds.' })
    }

    const qrDataUrl = await QRCode.toDataURL(sock.qr)
    res.json({ qr: qrDataUrl, userId })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
})

// Check connection status
app.get('/api/status/:userId', (req, res) => {
  const { userId } = req.params
  const sock = botsMap.get(userId)

  if (!sock) {
    return res.json({ status: 'not_initialized', userId })
  }

  const isConnected = sock.user && sock.user.id ? true : false
  res.json({ 
    status: isConnected ? 'connected' : 'disconnected', 
    userId,
    user: sock.user || null
  })
})

// Send single message
app.post('/api/send', async (req, res) => {
  try {
    const { userId, phone, message } = req.body

    if (!userId || !phone || !message) {
      return res.status(400).json({ error: 'Missing userId, phone, or message' })
    }

    const sock = botsMap.get(userId)
    if (!sock) {
      return res.status(400).json({ error: `Bot not initialized for user ${userId}. Initialize with /qr/:userId` })
    }

    if (!sock.user) {
      return res.status(400).json({ error: 'Bot not authenticated. Scan QR code first.' })
    }

    // Format phone number (remove non-digits, add country code if needed)
    const cleanPhone = phone.replace(/\D/g, '')
    const jid = `${cleanPhone}@s.whatsapp.net`

    await sock.sendMessage(jid, { text: message })
    res.json({ success: true, phone, messageId: Date.now() })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
})

// Send bulk messages
app.post('/api/bulk-send', async (req, res) => {
  try {
    const { userId, contacts, message } = req.body

    if (!userId || !contacts || !Array.isArray(contacts) || !message) {
      return res.status(400).json({ error: 'Missing userId, contacts (array), or message' })
    }

    const sock = botsMap.get(userId)
    if (!sock) {
      return res.status(400).json({ error: `Bot not initialized for user ${userId}` })
    }

    if (!sock.user) {
      return res.status(400).json({ error: 'Bot not authenticated. Scan QR code first.' })
    }

    const results = []
    for (const phone of contacts) {
      try {
        const cleanPhone = phone.replace(/\D/g, '')
        const jid = `${cleanPhone}@s.whatsapp.net`
        await sock.sendMessage(jid, { text: message })
        results.push({ phone, status: 'sent' })
        await new Promise(resolve => setTimeout(resolve, 1000)) // 1 sec delay between messages
      } catch (err) {
        results.push({ phone, status: 'failed', error: err.message })
      }
    }

    res.json({ success: true, total: contacts.length, results })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 WhatsApp Bulk Messaging SaaS Server`)
  console.log(`📡 Running on port ${PORT}`)
  console.log(`🔗 API Base: http://localhost:${PORT}`)
  console.log(`\n📖 Endpoints:`)
  console.log(`  GET  /api/qr/:userId        - Get QR code to authenticate`)
  console.log(`  GET  /api/status/:userId    - Check bot connection status`)
  console.log(`  POST /api/send              - Send single message`)
  console.log(`  POST /api/bulk-send         - Send bulk messages`)
  console.log(`  GET  /health                - Health check`)
  console.log(`\n`)
})
