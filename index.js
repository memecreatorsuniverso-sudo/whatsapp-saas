const express = require("express");
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, MessageRetryMap } = require("@whiskeysockets/baileys");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* ========== GLOBAL STATE ========== */
let qrImage = null;
let isReady = false;
let socketInstance = null;
let connectionStatus = "initializing";

/* ========== MIDDLEWARE ========== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

/* ========== WHATSAPP INITIALIZATION ========== */
async function initializeWhatsApp() {
  try {
    console.log("\n🔄 Initializing WhatsApp connection...");
    
    const { state, saveCreds } = await useMultiFileAuthState("./auth");
    
    socketInstance = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ["Ubuntu", "Chrome", "20.0"]
    });

    /* -------- CONNECTION EVENTS -------- */
    socketInstance.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          console.log("📱 QR Code detected - generating image...");
          qrImage = await QRCode.toDataURL(qr, {
            errorCorrectionLevel: "H",
            type: "image/png",
            width: 300,
            margin: 2,
            color: { dark: "#000000", light: "#FFFFFF" }
          });
          connectionStatus = "qr_ready";
          isReady = false;
          console.log("✅ QR code generated - waiting for scan...");
        } catch (err) {
          console.error("❌ Failed to generate QR:", err);
          connectionStatus = "qr_error";
        }
      }

      if (connection === "open") {
        console.log("✅ WhatsApp Connected Successfully!");
        connectionStatus = "connected";
        isReady = true;
        qrImage = null;
      }

      if (connection === "close") {
        const reason = lastDisconnect?.error?.output?.statusCode;
        if (reason === DisconnectReason.loggedOut) {
          console.log("⚠️ Device logged out");
          connectionStatus = "logged_out";
          qrImage = null;
          isReady = false;
        } else if (reason === DisconnectReason.connectionClosed) {
          console.log("⚠️ Connection closed - reconnecting...");
          connectionStatus = "reconnecting";
          await initializeWhatsApp();
        } else {
          console.log("⚠️ Connection disconnected:", reason);
          connectionStatus = "disconnected";
        }
      }
    });

    /* -------- CREDENTIALS UPDATE -------- */
    socketInstance.ev.on("creds.update", saveCreds);

    console.log("✅ WhatsApp client initialized\n");

  } catch (err) {
    console.error("❌ WhatsApp initialization failed:", err);
    connectionStatus = "error";
    setTimeout(() => initializeWhatsApp(), 5000); // Retry after 5 seconds
  }
}

/* ========== API ROUTES ========== */

// Get QR code
app.get("/api/qr", (req, res) => {
  res.json({
    qr: qrImage,
    ready: isReady,
    status: connectionStatus
  });
});

// Get status
app.get("/api/status", (req, res) => {
  res.json({
    connected: isReady,
    status: connectionStatus,
    hasQR: !!qrImage
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, status: connectionStatus });
});

// Logout
app.post("/api/logout", async (req, res) => {
  try {
    if (socketInstance) {
      await socketInstance.logout();
      console.log("📤 Logged out from WhatsApp");
      connectionStatus = "logged_out";
      isReady = false;
      qrImage = null;
      
      // Clean up auth directory
      const authDir = path.join(__dirname, "auth");
      if (fs.existsSync(authDir)) {
        fs.rmSync(authDir, { recursive: true, force: true });
      }
    }
    res.json({ ok: true, msg: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Send message
app.post("/api/send", async (req, res) => {
  const { number, message } = req.body;

  if (!number || !message) {
    return res.status(400).json({ error: "Missing number or message" });
  }

  if (!isReady) {
    return res.status(400).json({ error: "WhatsApp not connected" });
  }

  try {
    const chatId = number.includes("@") ? number : `${number}@c.us`;
    await socketInstance.sendMessage(chatId, { text: message });
    res.json({ ok: true, msg: "Message sent" });
  } catch (err) {
    console.error("Send error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Serve dashboard
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ========== START SERVER ========== */
(async () => {
  try {
    await initializeWhatsApp();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📱 Open http://localhost:${PORT} to view dashboard\n`);
    });

  } catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
  }
})();

/* ========== GRACEFUL SHUTDOWN ========== */
process.on("SIGINT", async () => {
  console.log("\n⏹️  Shutting down...");
  if (socketInstance) {
    await socketInstance.end().catch(() => {});
  }
  process.exit(0);
});
