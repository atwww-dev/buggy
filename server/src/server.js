require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Trello = require('trello');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Trello client
const trello = new Trello(process.env.TRELLO_API_KEY, process.env.TRELLO_TOKEN);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.post('/api/feedback', async (req, res) => {
  try {
    const { title, description, category, priority, steps, screenshot, url, browser } = req.body;

    // Format the description with all the details
    const formattedDescription = `
**Description:**
${description}

**Category:** ${category}
**Priority:** ${priority}

**Reproduction Steps:**
${steps}

**Technical Details:**
- URL: ${url}
- Browser: ${browser}
- Timestamp: ${new Date().toISOString()}
    `;

    // Create Trello card
    const card = await trello.addCard(
      title,
      formattedDescription,
      process.env.TRELLO_LIST_ID,
      {
        urlSource: screenshot,
        labels: [category]
      }
    );

    res.json({ success: true, cardId: card.id });
  } catch (error) {
    console.error('Error creating Trello card:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 