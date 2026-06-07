const express = require("express");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");

const app = express();
app.use(express.json());

let sock;
let isStarting = false;

// =====================
// START WHATSAPP
// =====================
async function startWhatsApp() {
    if (isStarting) return;
    isStarting = true;

    const { state, saveCreds } = await useMultiFileAuthState("./auth");

    sock = makeWASocket({
        auth: state,
        logger: P({ level: "silent" })
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "open") {
            console.log("✅ WhatsApp CONNECTED");
            isStarting = false;
        }

        if (connection === "close") {
            const reason =
                lastDisconnect?.error?.output?.statusCode;

            console.log("❌ Disconnected:", reason);

            // IMPORTANT: prevent infinite restart loop
            isStarting = false;

            setTimeout(() => {
                console.log("🔄 Reconnecting WhatsApp...");
                startWhatsApp();
            }, 8000);
        }
    });
}

startWhatsApp();


// =====================
// SAFE SEND FUNCTION
// =====================
async function sendMessage(phone, message) {
    try {
        if (!sock) {
            console.log("❌ WhatsApp not ready");
            return;
        }

        await sock.sendMessage(`${phone}@s.whatsapp.net`, {
            text: message
        });

        console.log("📤 Sent:", phone);
    } catch (err) {
        console.log("Send error:", err.message);
    }
}


// =====================
// UPGRADE ENDPOINT
// =====================
app.post("/notify-upgraded", async (req, res) => {
    const { name, email, phone, planDays } = req.body;

    if (!phone) {
        return res.status(400).json({ error: "phone required" });
    }

    await sendMessage(
        phone,
`🎉 Hello ${name}

Premium Activated 🎬
Email: ${email}
Plan: ${planDays} days

Enjoy movies 🍿`
    );

    res.json({ success: true });
});


// =====================
// EXPIRY ENDPOINT
// =====================
app.post("/notify-expiry", async (req, res) => {
    const { name, email, phone } = req.body;

    if (!phone) {
        return res.status(400).json({ error: "phone required" });
    }

    await sendMessage(
        phone,
`⏳ Hello ${name}

Your subscription is ending soon.

Email: ${email}
👉 Upgrade now`
    );

    res.json({ success: true });
});


// =====================
// HEALTH CHECK
// =====================
app.get("/", (req, res) => {
    res.send("CULLO WhatsApp Bot Running 🚀");
});


// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🚀 Server running on", PORT);
});
