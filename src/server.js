const express = require('express');
const { Client } = require('@notionhq/client');
const dotenv = require('dotenv');
const cors = require('cors');


// Läs miljövariabler från .env.local
dotenv.config({ path: '.env.local' });

// Initialisera Express-server
const app = express();
const port = 8000;

// Hämta Notion API-token och Database ID från miljövariabler
const notionSecret = process.env.NOTION_SECRET;
const notionDatabaseId = process.env.NOTION_DATABASE_ID;

// Kontrollera att vi har nödvändiga miljövariabler
if (!notionSecret || !notionDatabaseId) {
    throw new Error('Notion Secret eller Database ID saknas i miljövariabler');
}

// Initialisera Notion-klienten med din API-token
const notion = new Client({ auth: notionSecret });

app.use(cors());

// Endpoint 1: Nå alla recept komplett
app.get('/all-data', async (req, res) => {
    try {
        // Hämta data från Notion-databasen
        const query = await notion.databases.query({ database_id: notionDatabaseId });

        // Svara med resultatet som JSON
        res.json(query.results);
    } catch (error) {
        res.status(500).json({ error: 'Kunde inte hämta data från Notion' });
    }
});

// Endpoint 2: Nå alla recept med endast Titel och Senast Tillagat
app.get('/all-structured-recipe-cards', async (req, res) => {
    try {
        const query = await notion.databases.query({ database_id: notionDatabaseId });

        // Hämta bara titel och senast tillagat
        const results = query.results.map((card) => {

            const id = card.id || null;
            const title = card.properties?.['Title']?.title?.[0]?.plain_text || "ingen titel"
            const mainIngredient = card.properties?.["Huvudingrediens"]?.select?.name || null
            const categories = (card.properties?.["Kategori"]?.multi_select).map((item) => item.name) || null
            const lastMealPrep = {
                start: card.properties?.['Meal Prep']?.date?.start || null,
                end: card.properties?.['Meal Prep']?.date?.end || null,
                mostRecentTimestamp:
                    (card.properties?.['Meal Prep']?.date?.end)
                        ? (card.properties?.['Meal Prep']?.date?.end)
                        : (card.properties?.['Meal Prep']?.date?.start || null)

            }
            const rating =
            {
                lable: card.properties?.['Rating']?.select?.name || null,
                value: card.properties?.['Rating']?.select?.name
                    ? Number(card.properties['Rating'].select.name.match(/\((\d+)\)/)?.[1]) || null
                    : null
            }




            // const lastCooked = page.properties['Senast Tillagat']?.date?.start || 'Ingen information om tillagning';
            // const direktlink = page.properties["Direktlänk Online"]?.url || " ingen länk";
            // const instructions = page.properties["✅ INSTRUKTIONER"]?.rich_text.map((segment) => segment.text.content).join("") || "no instruktioner";

            return { id, title, mainIngredient, categories, lastMealPrep, rating };
        });

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Kunde inte hämta data från Notion' });
    }
});

// Endpoint 3: Nå alla recept med Titel, Senast Tillagat och Innehållsförteckning
app.get('/notion-data/details', async (req, res) => {
    try {
        const query = await notion.databases.query({ database_id: notionDatabaseId });

        // Hämta titel, senast tillagat och innehållsförteckning
        const results = query.results.map((page) => {
            const title = page.properties['Titel']?.title?.[0]?.plain_text || 'Ingen titel';
            const lastCooked = page.properties['Senast Tillagat']?.date?.start || 'Ingen information om tillagning';
            const content = page.properties['✅ INSTRUKTIONER']?.rich_text?.map(text => text.text.content).join('\n') || 'Ingen instruktion';

            return { title, lastCooked, content };
        });

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Kunde inte hämta data från Notion' });
    }
});

// Endpoint 4: Nå ett specifikt recept baserat på ID
app.get('/notion-data/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Hämta specifik sida (recept) med ID
        const page = await notion.pages.retrieve({ page_id: id });

        // Skicka tillbaka hela sidan
        res.json(page);
    } catch (error) {
        res.status(500).json({ error: 'Kunde inte hämta specifikt recept', details: error.message });
    }
});

// Starta servern
app.listen(port, () => {
    console.log(`Servern kör på http://localhost:${port}`);
});
