#!/usr/bin/env node

/**
 * Test WhatsApp SaaS API locally
 * Usage: node test-api.js
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000'
const userId = 'testuser'

console.log(`\n🧪 WhatsApp SaaS API Test Suite`)
console.log(`📡 Base URL: ${BASE_URL}\n`)

async function test(name, fn) {
  try {
    console.log(`✅ ${name}...`)
    await fn()
  } catch (error) {
    console.error(`❌ ${name} failed:`, error.message)
  }
}

async function main() {
  // Test 1: Health check
  await test('Health Check', async () => {
    const res = await fetch(`${BASE_URL}/health`)
    const data = await res.json()
    if (data.status !== 'ok') throw new Error('Health check failed')
    console.log(`   Status: ${data.status}, Uptime: ${data.uptime.toFixed(2)}s\n`)
  })

  // Test 2: Initialize bot (get QR)
  await test('Get QR Code', async () => {
    const res = await fetch(`${BASE_URL}/api/qr/${userId}`)
    const data = await res.json()
    if (!data.qr) throw new Error('No QR code returned')
    console.log(`   QR generated for userId: ${userId}`)
    console.log(`   Bot initializing... (takes 10-15 seconds)\n`)
  })

  // Wait for bot to initialize
  await new Promise(resolve => setTimeout(resolve, 15000))

  // Test 3: Check status
  await test('Check Bot Status', async () => {
    const res = await fetch(`${BASE_URL}/api/status/${userId}`)
    const data = await res.json()
    console.log(`   Status: ${data.status}`)
    if (data.user) {
      console.log(`   User: ${data.user.name || 'Authenticated'}\n`)
    } else {
      console.log(`   ⚠️  Bot not authenticated yet. Scan QR code above.\n`)
    }
  })

  // Test 4: Send message (requires authentication)
  await test('Send Test Message', async () => {
    const res = await fetch(`${BASE_URL}/api/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId,
        phone: '919876543210',
        message: 'Hello from WhatsApp SaaS! 🚀'
      })
    })
    const data = await res.json()
    if (res.status === 400) {
      console.log(`   ⚠️  ${data.error}\n`)
    } else if (data.success) {
      console.log(`   Message sent to ${data.phone}\n`)
    }
  })

  // Test 5: Bulk send
  await test('Send Bulk Messages', async () => {
    const res = await fetch(`${BASE_URL}/api/bulk-send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId,
        contacts: ['919876543210', '919876543211', '919876543212'],
        message: 'Bulk test from WhatsApp SaaS'
      })
    })
    const data = await res.json()
    if (res.status === 400) {
      console.log(`   ⚠️  ${data.error}\n`)
    } else if (data.success) {
      console.log(`   Sent to ${data.total} contacts`)
      const sent = data.results.filter(r => r.status === 'sent').length
      console.log(`   Success: ${sent}, Failed: ${data.total - sent}\n`)
    }
  })

  console.log(`✨ Tests complete!\n`)
}

// Run tests
main().catch(console.error)
