
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { SessionsClient } = require('@google-cloud/dialogflow');
const uuid = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Crear archivo temporal con las credenciales desde variable de entorno
const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
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
    res.json({ reply: result.fulfillmentText });
  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: "Error al contactar Dialogflow" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
