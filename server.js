const express = require('express');
const cors = require('cors');

const recipesRoutes = require('./routes/notinRecepies');


// Initialisera Express-server
const app = express();
const port = 8000;

app.use(cors());

app.get(['/', '/api'], async (req, res) => {
    try {
        res.status(200).json({ message: 'Välkommen till kokboksapiet! 🥬 Denna rutten ger ingen data. gå till /api/data-i-want-here' });
    } catch (error) {
        res.status(500).json({ error: 'Kunde inte hämta data från Notion' });
    }
});

app.use('/api/recipes', recipesRoutes);



// Starta servern
app.listen(port, () => {
    console.log(`Servern kör på http://localhost:${port}`);
});
