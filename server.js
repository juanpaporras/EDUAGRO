const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { SessionsClient } = require('@google-cloud/dialogflow');
const uuid = require('uuid');

const app = express();

// ✅ CORS para tu dominio en Railway
app.use(cors({
  origin: 'https://eduagro.up.railway.app'
}));

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
if (!credentialsJson) {
  throw new Error("❌ GOOGLE_APPLICATION_CREDENTIALS_JSON no está definida en variables de entorno.");
}

const credentials = JSON.parse(credentialsJson);
fs.writeFileSync('temp-credentials.json', JSON.stringify(credentials));

const projectId = credentials.project_id;
const sessionClient = new SessionsClient({
  keyFilename: 'temp-credentials.json'
});

app.post('/dialogflow', async (req, res) => {
  const message = req.body.message;
  const sessionId = uuid.v4();
  const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: message,
        languageCode: 'es',
      },
    },
  };

  try {
    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;

    // 🟢 Log detallado del resultado completo
    console.log("🔍 QueryResult completo:", JSON.stringify(result, null, 2));

    // ✅ Extrae texto desde fulfillmentText o fallback desde fulfillmentMessages
    const reply =
      result.fulfillmentText ||
      (result.fulfillmentMessages &&
        result.fulfillmentMessages[0] &&
        result.fulfillmentMessages[0].text &&
        result.fulfillmentMessages[0].text.text[0]) ||
      "";

    console.log("🟢 Respuesta detectada:", reply);
    res.json({ reply });
  } catch (error) {
    console.error("❌ ERROR AL CONSULTAR DIALOGFLOW:");
    console.error("Mensaje:", error.message);
    console.error("Código:", error.code);
    console.error("Detalles:", error.details);
    res.status(500).json({ reply: "Error al contactar Dialogflow" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔥 Servidor EDUAGRO iniciado en http://localhost:${PORT}`);
});

