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



function getPlainTextFromRichText(prop) {
    return prop?.rich_text?.map(t => t.plain_text).join('') || null;
}


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
            const url = card.url || null
            const created_time = card.created_time || null
            const last_edited_time = card.last_edited_time || null
            const source = card.properties?.['Källa']?.select?.name || null
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
            const rating = {
                label: card.properties?.['Rating']?.select?.name || null,
                value: card.properties?.['Rating']?.select?.name
                    ? Number(card.properties['Rating'].select.name.match(/\((\d+)\)/)?.[1]) || null
                    : null
            };
            const mealType = (card.properties?.["Måltidstyp"]?.multi_select).map((item) => item.name) || null
            const cookingMethod = (card.properties?.['Tillagningsmetod']?.multi_select).map((item) => item.name) || null
            const introduction = getPlainTextFromRichText(card.properties?.['Introduktion']);
            const instructions = getPlainTextFromRichText(card.properties?.['Instruktioner']);
            const chefNotes = getPlainTextFromRichText(card.properties?.['Tips']);
            const personalNotes = getPlainTextFromRichText(card.properties?.['Notes (egna)']);

            // ittererar över varje variant som kan finnas.
            const variantsToItterate = ["original", "custom1", "custom2", "custom3"]
            const variants = variantsToItterate.flatMap((variant) => {
                // bygger ihop ett objekt per variant
                const variantObject = {
                    isOriginal: variant == "original" ? true : false,
                    title: getPlainTextFromRichText(card.properties?.[`Titel (${variant})`]),
                    personalComment: getPlainTextFromRichText(card.properties?.[`Kommentar (${variant})`]),
                    ingredients: getPlainTextFromRichText(card.properties?.[`Ingredienser (${variant})`]),
                    macrosPerServing: {
                        calories: card.properties?.[`Kcal/port (${variant})`]?.number || null,
                        protein: card.properties?.[`Protein(g)/port (${variant})`]?.number || null,
                        fat: card.properties?.[`Fett(g)/port (${variant})`]?.number || null,
                        carbohydrates: card.properties?.[`Kolhydrater(g)/port (${variant})`]?.number || null,
                    },
                    servings: card.properties?.[`Antal Portioner (${variant})`]?.number || null,
                }
                // om varianten har vettigt innehåll så skickas den med annars ej. makros per serveringar kommr alltid ha värde även om keys i den är false så därför kan vi nte använda den som conditional.
                //varianter med key isOriginal kommer alltid med
                if (variantObject.isOriginal || variantObject.personalComment || variantObject.title || variantObject.ingredients || variantObject.servings) {
                    return [variantObject]
                } else {
                    // flatMap ser tom array i returnern som ingen return alls. då slipper vi nyll i resultatarrayen som map() annars gett
                    return []
                }

            })

            return { id, title, url, created_time, last_edited_time, source, mainIngredient, categories, lastMealPrep, rating, mealType, cookingMethod, introduction, instructions, chefNotes, personalNotes, variants };
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