const express = require("express");
const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");

const app = express();
app.use(express.json());

// ✅ SAFE WhatsApp setup (Render compatible)
const client = new Client({
    authStrategy: new LocalAuth(), // NO /data (fixes your error)
    puppeteer: {
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox"
        ]
    }
});

// QR login
client.on("qr", (qr) => {
    console.log("📲 Scan QR below:");
    qrcode.generate(qr, { small: true });
});

// Ready
client.on("ready", () => {
    console.log("✅ WhatsApp is READY");
});

client.initialize();


// =====================
// SEND FUNCTION
// =====================
async function sendMessage(phone, message) {
    try {
        await client.sendMessage(`${phone}@c.us`, message);
        return true;
    } catch (err) {
        console.log("Send error:", err.message);
        return false;
    }
}


// =====================
// 1. UPGRADE ENDPOINT
// =====================
app.post("/notify-upgraded", async (req, res) => {
    const { name, email, phone, planDays } = req.body;

    if (!phone) return res.status(400).json({ error: "phone required" });

    const msg =
`🎉 Hello ${name},

Your CULLO Movies Premium is ACTIVE.

📧 Email: ${email}
⏳ Plan: ${planDays} days

Enjoy unlimited movies 🎬`;

    await sendMessage(phone, msg);

    res.json({ success: true });
});


// =====================
// 2. EXPIRY ENDPOINT
// =====================
app.post("/notify-expiry", async (req, res) => {
    const { name, email, phone } = req.body;

    if (!phone) return res.status(400).json({ error: "phone required" });

    const msg =
`⏳ Hello ${name},

Your CULLO Movies Premium is ending soon.

📧 Email: ${email}

⚠️ Renew now to continue watching movies 🎬`;

    await sendMessage(phone, msg);

    res.json({ success: true });
});


// =====================
// TEST ROUTE
// =====================
app.get("/", (req, res) => {
    res.send("CULLO WhatsApp Server Running 🚀");
});


// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
