import { config } from 'dotenv';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { FeedbackRequest, ErrorResponse, SuccessResponse } from './types';
import { TrelloService, CreateCardParams } from './services/trello';

// Load environment variables
config();

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
    origin: ['http://localhost:3000', 'https://buggy-flame.vercel.app', 'https://sorevo.ro'],
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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Handle preflight requests
app.options('/api/feedback', cors(corsOptions));

app.get('/', cors(corsOptions), async (_req: Request, res: Response) => {
    res.json({ message: 'Hello, world!' });
});

// Routes
app.post('/api/feedback', cors(corsOptions), async (req: Request<{}, {}, FeedbackRequest>, res: Response<SuccessResponse | ErrorResponse>) => {
    try {
        // Validate required fields
        const { title, description, screenshot } = req.body;

        if (!title || !description) {
            const response: ErrorResponse = {
                success: false,
                message: 'Missing required fields (title, description)'
            };
            return res.status(400).json(response);
        }

        // Check if screenshot is valid (if provided)
        if (screenshot) {
            // Add some basic validation for screenshot data
            if (typeof screenshot !== 'string') {
                const response: ErrorResponse = {
                    success: false,
                    message: 'Screenshot must be a string'
                };
                return res.status(400).json(response);
            }

            // Validate it's a proper data URL or base64 string
            if (screenshot.startsWith('data:image/')) {
                // It's a data URL
                const isValidDataUrl = /^data:image\/(png|jpeg|jpg|gif);base64,[A-Za-z0-9+/=]+$/.test(screenshot);
                if (!isValidDataUrl) {
                    const response: ErrorResponse = {
                        success: false,
                        message: 'Invalid screenshot data URL format'
                    };
                    return res.status(400).json(response);
                }
            } else {
                // It should be a base64 string
                try {
                    const buffer = Buffer.from(screenshot, 'base64');
                    // Check if decoding works and results in reasonable data
                    if (buffer.length === 0 || buffer.length < 100) {  // Just a basic check
                        const response: ErrorResponse = {
                            success: false,
                            message: 'Invalid base64 data for screenshot'
                        };
                        return res.status(400).json(response);
                    }
                } catch (error) {
                    const response: ErrorResponse = {
                        success: false,
                        message: 'Failed to process screenshot data'
                    };
                    return res.status(400).json(response);
                }
            }
        }

        // Prepare Trello card data    
        const trelloParams: CreateCardParams = {
            name: title,
            desc: `**Description:**
${description}

**Category:** ${req.body.category || 'Not specified'}
**Priority:** ${req.body.priority || 'Not specified'}

**Reproduction Steps:**
${req.body.steps || 'Not specified'}

**Technical Details:**
- URL: ${req.body.url || 'Not specified'}
- Browser: ${req.body.browser || 'Not specified'}
- Timestamp: ${new Date().toISOString()}`,
            idList: process.env.TRELLO_LIST_ID as string
        };

        // Add labels based on priority and category
        const labels: string[] = [];

        if (req.body.priority) {
            switch (req.body.priority) {
                case 'high':
                    if (process.env.TRELLO_LABEL_HIGH_PRIORITY) {
                        labels.push(process.env.TRELLO_LABEL_HIGH_PRIORITY);
                    }
                    break;
                case 'medium':
                    if (process.env.TRELLO_LABEL_MEDIUM_PRIORITY) {
                        labels.push(process.env.TRELLO_LABEL_MEDIUM_PRIORITY);
                    }
                    break;
                case 'low':
                    if (process.env.TRELLO_LABEL_LOW_PRIORITY) {
                        labels.push(process.env.TRELLO_LABEL_LOW_PRIORITY);
                    }
                    break;
            }
        }

        if (req.body.category) {
            switch (req.body.category) {
                case 'bug':
                    if (process.env.TRELLO_LABEL_BUG) {
                        labels.push(process.env.TRELLO_LABEL_BUG);
                    }
                    break;
                case 'feature':
                    if (process.env.TRELLO_LABEL_FEATURE) {
                        labels.push(process.env.TRELLO_LABEL_FEATURE);
                    }
                    break;
                case 'improvement':
                    if (process.env.TRELLO_LABEL_IMPROVEMENT) {
                        labels.push(process.env.TRELLO_LABEL_IMPROVEMENT);
                    }
                    break;
            }
        }

        if (labels.length > 0) {
            trelloParams.idLabels = labels;
        }

        // Create the Trello card
        try {
            console.log('Creating Trello card');
            const card = await trelloService.createCard(trelloParams);

            // Add screenshot as attachment if present
            if (screenshot && card.id) {
                console.log('Adding screenshot attachment');
                try {
                    await trelloService.addBase64ImageAttachment(card.id, screenshot);
                    console.log('Screenshot added successfully');
                } catch (attachmentError) {
                    console.error('Failed to add screenshot:', attachmentError);
                    // We continue even if the screenshot attachment fails
                }
            }

            const response: SuccessResponse = {
                success: true,
                message: 'Feedback submitted successfully',
                data: {
                    cardId: card.id,
                    cardUrl: card.url
                }
            };

            return res.status(200).json(response);
        } catch (trelloError) {
            console.error('Trello API error:', trelloError);
            const response: ErrorResponse = {
                success: false,
                message: `Failed to create Trello card: ${trelloError instanceof Error ? trelloError.message : 'Unknown error'}`
            };
            return res.status(500).json(response);
        }
    } catch (error) {
        console.error('Server error:', error);
        const response: ErrorResponse = {
            success: false,
            message: 'Server error processing feedback'
        };
        return res.status(500).json(response);
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