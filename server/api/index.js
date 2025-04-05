require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Trello = require('trello');

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'https://buggy-flame.vercel.app'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Initialize Trello client
const trello = new Trello(process.env.TRELLO_API_KEY, process.env.TRELLO_TOKEN);

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Handle preflight requests
app.options('/api/feedback', cors(corsOptions));

app.get('/', cors(corsOptions), async (req, res) => {
  res.json({ message: 'Hello, world!' });
});

// Routes
app.post('/api/feedback', cors(corsOptions), async (req, res) => {
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

    res.json({ success: true });
  } catch (error) {
    console.error('Error creating Trello card:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 