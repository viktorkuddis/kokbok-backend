const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');


dotenv.config({ path: '.env.local' });



const { Client } = require('@notionhq/client');

// Hämta Notion API-token och Database ID från miljövariabler
const notionSecret = process.env.NOTION_SECRET;
const notionDatabaseId = process.env.NOTION_DATABASE_ID;

// Initialisera Notion-klienten med din API-token
const notion = new Client({ auth: notionSecret });


// RUTTER::::

// kompletta data direkt från notion:
router.get('/all-data', async (req, res) => {
    try {
        const query = await notion.databases.query({ database_id: notionDatabaseId });

        res.json(query.results);
    } catch (error) {
        res.status(500).json({ error: 'Kunde inte hämta data från Notion' });
    }
});

// endast nödvändig data enligt min egna önskade struktur.
router.get('/all-recipes-structured', async (req, res) => {
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

// Ett receptt
router.get('/recepie/:id', async (req, res) => {
    // try {
    //     const query = await notion.databases.query({ database_id: notionDatabaseId });

    //     // Hämta titel, senast tillagat och innehållsförteckning
    //     const results = query.results.map((page) => {
    //         const title = page.properties['Titel']?.title?.[0]?.plain_text || 'Ingen titel';
    //         const lastCooked = page.properties['Senast Tillagat']?.date?.start || 'Ingen information om tillagning';
    //         const content = page.properties['✅ INSTRUKTIONER']?.rich_text?.map(text => text.text.content).join('\n') || 'Ingen instruktion';

    //         return { title, lastCooked, content };
    //     });

    //     res.json(results);
    // } catch (error) {
    //     res.status(500).json({ error: 'Kunde inte hämta data från Notion' });
    // }
});


module.exports = router;