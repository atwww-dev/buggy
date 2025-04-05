import { config } from 'dotenv';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { FeedbackRequest, ErrorResponse, SuccessResponse } from './types';
import { TrelloService } from './services/trello';

// Load environment variables
config();

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
    origin: ['http://localhost:3000', 'https://buggy-flame.vercel.app'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

// Type check for environment variables
if (!process.env.TRELLO_API_KEY || !process.env.TRELLO_TOKEN || !process.env.TRELLO_LIST_ID) {
    throw new Error('Missing required environment variables');
}

// Initialize Trello service
const trelloService = new TrelloService(
    process.env.TRELLO_API_KEY,
    process.env.TRELLO_TOKEN
);

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Handle preflight requests
app.options('/api/feedback', cors(corsOptions));

app.get('/', cors(corsOptions), async (_req: Request, res: Response) => {
    res.json({ message: 'Hello, world!' });
});

// Routes
app.post('/api/feedback', cors(corsOptions), async (
    req: Request<{}, {}, FeedbackRequest>,
    res: Response<SuccessResponse | ErrorResponse>
) => {
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
        const card = await trelloService.createCard({
            name: title,
            desc: formattedDescription,
            idList: process.env.TRELLO_LIST_ID as string,
            urlSource: screenshot,
            idLabels: [category]
        });

        // Print the card to the console
        console.log('Card created:', card);
        res.json({ success: true, cardId: card.id });
    } catch (error) {
        console.error('Error creating Trello card:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// For better type checking of unhandled rejections
process.on('unhandledRejection', (reason: unknown) => {
    console.error('Unhandled Rejection:', reason);
    process.exit(1);
}); 