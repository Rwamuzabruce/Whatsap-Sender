const express = require("express");
const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const P = require("pino");
const qrcode = require("qrcode-terminal");

const app = express();
app.use(express.json());

let sock;

// =====================
// START WHATSAPP
// =====================
async function startWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState("./auth");

    sock = makeWASocket({
        auth: state,
        logger: P({ level: "silent" })
    });

    sock.ev.on("creds.update", saveCreds);

    // =====================
    // CONNECTION EVENTS
    // =====================
    sock.ev.on("connection.update", (update) => {
        const { connection, qr } = update;

        // ✅ SHOW QR CODE
        if (qr) {
            console.log("\n📲 SCAN THIS QR CODE:\n");
            qrcode.generate(qr, { small: true });
        }

        if (connection === "open") {
            console.log("✅ WhatsApp CONNECTED SUCCESSFULLY");
        }

        if (connection === "close") {
            console.log("❌ Disconnected. Reconnecting...");
            startWhatsApp();
        }
    });
}

startWhatsApp();


// =====================
// SEND FUNCTION
// =====================
async function sendMessage(phone, message) {
    try {
        if (!sock) return;

        await sock.sendMessage(`${phone}@s.whatsapp.net`, {
            text: message
        });

        console.log("📤 Sent to:", phone);
    } catch (err) {
        console.log("Send error:", err.message);
    }
}


// =====================
// 1. UPGRADE ENDPOINT
// =====================
app.post("/notify-upgraded", async (req, res) => {
    const { name, email, phone, planDays } = req.body;

    if (!phone) {
        return res.status(400).json({ error: "phone required" });
    }

    await sendMessage(
        phone,
`🎉 Hello ${name}

Your CULLO Movies Premium is ACTIVE 🎬

📧 Email: ${email}
⏳ Plan: ${planDays} days

Enjoy unlimited movies 🍿`
    );

    res.json({
        success: true,
        type: "upgrade"
    });
});


// =====================
// 2. EXPIRY ENDPOINT
// =====================
app.post("/notify-expiry", async (req, res) => {
    const { name, email, phone } = req.body;

    if (!phone) {
        return res.status(400).json({ error: "phone required" });
    }

    await sendMessage(
        phone,
`⏳ Hello ${name}

Your CULLO Movies Premium is ending soon.

📧 Email: ${email}

⚠️ Renew now to continue watching movies 🎬`
    );

    res.json({
        success: true,
        type: "expiry"
    });
});


// =====================
// TEST ROUTE
// =====================
app.get("/", (req, res) => {
    res.send("CULLO WhatsApp Bot Running 🚀");
});


// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🚀 Server running on port", PORT);
});
