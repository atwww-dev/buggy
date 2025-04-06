import { TrelloCard } from '../types';

const TRELLO_API_URL = 'https://api.trello.com/1';

export interface CreateCardParams {
    name: string;
    desc: string;
    idList: string;
    urlSource?: string;
    idLabels?: string[];
}

interface LogMessage {
    timestamp: string;
    level: 'INFO' | 'ERROR' | 'DEBUG';
    service: 'TrelloService';
    operation: string;
    message: string;
    details?: Record<string, any>;
}

export class TrelloService {
    private apiKey: string;
    private token: string;

    constructor(apiKey: string, token: string) {
        if (!apiKey || !token) {
            throw new Error('Trello API key and token are required');
        }
        this.apiKey = apiKey;
        this.token = token;
        this.log({
            level: 'INFO',
            operation: 'INIT',
            message: 'TrelloService initialized',
            details: {
                apiKey: this.maskApiKey(apiKey),
                token: this.maskToken(token)
            }
        });
    }

    private log(message: Omit<LogMessage, 'timestamp' | 'service'>) {
        const logMessage: LogMessage = {
            timestamp: new Date().toISOString(),
            service: 'TrelloService',
            ...message
        };
        console.log(JSON.stringify(logMessage, null, 2));
    }

    private maskApiKey(key: string): string {
        return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
    }

    private maskToken(token: string): string {
        return `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
    }

    private async fetchTrello<T>(
        endpoint: string,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
        params?: Record<string, string | string[]>
    ): Promise<T> {
        const url = new URL(`${TRELLO_API_URL}${endpoint}`);

        // Add authentication parameters first
        url.searchParams.append('key', this.apiKey);
        url.searchParams.append('token', this.token);

        // Add any additional parameters
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach(v => url.searchParams.append(key, v));
                } else {
                    url.searchParams.append(key, value);
                }
            });
        }

        this.log({
            level: 'DEBUG',
            operation: 'API_REQUEST',
            message: `Making ${method} request to ${endpoint}`,
            details: {
                endpoint,
                method,
                params: params ? { ...params, key: '[REDACTED]', token: '[REDACTED]' } : undefined
            }
        });

        try {
            const response = await fetch(url.toString(), {
                method,
                headers: {
                    'Accept': 'application/json'
                }
            });

            const responseText = await response.text();

            if (!response.ok) {
                this.log({
                    level: 'ERROR',
                    operation: 'API_ERROR',
                    message: `Trello API error: ${response.status} ${response.statusText}`,
                    details: {
                        status: response.status,
                        statusText: response.statusText,
                        error: responseText
                    }
                });
                throw new Error(`Trello API error (${response.status}): ${responseText}`);
            }

            const data = JSON.parse(responseText);
            return data;
        } catch (error) {
            this.log({
                level: 'ERROR',
                operation: 'API_ERROR',
                message: 'Failed to complete Trello API request',
                details: {
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            });
            throw error;
        }
    }

    async createCard(params: CreateCardParams): Promise<TrelloCard> {
        this.log({
            level: 'INFO',
            operation: 'CREATE_CARD',
            message: 'Creating new Trello card',
            details: {
                name: params.name,
                listId: params.idList,
                hasScreenshot: !!params.urlSource,
                labelCount: params.idLabels?.length || 0
            }
        });

        const { name, desc, idList, urlSource, idLabels } = params;

        // Step 1: Create the card first (without attachments)
        const card = await this.fetchTrello<TrelloCard>('/cards', 'POST', {
            name,
            desc,
            idList
        });

        // Step 2: Handle attachments if present
        if (urlSource) {
            try {
                // Add a note about screenshot in description
                const updatedDesc = desc + '\n\n*Screenshot attached*';
                await this.fetchTrello(`/cards/${card.id}`, 'PUT', {
                    desc: updatedDesc
                });

                // Add the attachment via the separate attachments endpoint
                if (urlSource.startsWith('data:image')) {
                    // For base64 data URLs
                    await this.addBase64ImageAttachment(card.id, urlSource);
                } else {
                    // For regular URLs
                    await this.addAttachmentToCard(card.id, urlSource);
                }
            } catch (error) {
                this.log({
                    level: 'ERROR',
                    operation: 'ADD_ATTACHMENT_ERROR',
                    message: `Failed to add screenshot to card ${card.id}`,
                    details: {
                        error: error instanceof Error ? error.message : 'Unknown error'
                    }
                });
                // Continue anyway - we have the card created
            }
        }

        // Step 3: Add labels if provided
        if (idLabels && idLabels.length > 0) {
            for (const labelId of idLabels) {
                try {
                    await this.addLabelToCard(card.id, labelId);
                } catch (error) {
                    this.log({
                        level: 'ERROR',
                        operation: 'ADD_LABEL_ERROR',
                        message: `Failed to add label ${labelId} to card ${card.id}`,
                        details: {
                            error: error instanceof Error ? error.message : 'Unknown error'
                        }
                    });
                    // Continue with other labels
                }
            }
        }

        this.log({
            level: 'INFO',
            operation: 'CREATE_CARD_SUCCESS',
            message: 'Successfully created Trello card',
            details: {
                cardId: card.id,
                name: card.name
            }
        });

        return card;
    }

    async getCard(cardId: string): Promise<TrelloCard> {
        this.log({
            level: 'DEBUG',
            operation: 'GET_CARD',
            message: `Fetching card details for ${cardId}`
        });

        const card = await this.fetchTrello<TrelloCard>(`/cards/${cardId}`);

        this.log({
            level: 'DEBUG',
            operation: 'GET_CARD_SUCCESS',
            message: `Successfully fetched card ${cardId}`,
            details: {
                name: card.name,
                status: card.closed ? 'closed' : 'open'
            }
        });

        return card;
    }

    async addLabelToCard(cardId: string, labelId: string): Promise<void> {
        this.log({
            level: 'INFO',
            operation: 'ADD_LABEL',
            message: `Adding label to card ${cardId}`,
            details: { labelId }
        });

        await this.fetchTrello(`/cards/${cardId}/idLabels`, 'POST', { idLabel: labelId });

        this.log({
            level: 'INFO',
            operation: 'ADD_LABEL_SUCCESS',
            message: `Successfully added label to card ${cardId}`
        });
    }

    async addAttachmentToCard(cardId: string, url: string): Promise<void> {
        this.log({
            level: 'INFO',
            operation: 'ADD_ATTACHMENT',
            message: `Adding attachment to card ${cardId}`,
            details: { url: url.substring(0, 50) + '...' }
        });

        await this.fetchTrello(`/cards/${cardId}/attachments`, 'POST', { url });

        this.log({
            level: 'INFO',
            operation: 'ADD_ATTACHMENT_SUCCESS',
            message: `Successfully added attachment to card ${cardId}`
        });
    }

    async addBase64ImageAttachment(cardId: string, base64Data: string): Promise<void> {
        this.log({
            level: 'INFO',
            operation: 'ADD_BASE64_IMAGE_ATTACHMENT',
            message: `Adding base64 image attachment to card ${cardId}`,
            details: { dataLength: base64Data.length }
        });

        try {
            // Extract the base64 content and MIME type
            let fileContent: string;
            let mimeType = 'image/png';

            if (base64Data.startsWith('data:')) {
                // Parse the data URL to extract mime type and content
                const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);

                if (!matches || matches.length !== 3) {
                    throw new Error('Invalid data URL format');
                }

                mimeType = matches[1];
                fileContent = matches[2];
            } else {
                // Already raw base64
                fileContent = base64Data;
            }

            // Create a buffer from the base64 data
            const buffer = Buffer.from(fileContent, 'base64');

            // Generate a unique boundary string for multipart form
            const boundary = `----FormBoundary${Math.random().toString(16).substring(2)}`;

            // Create the multipart form data manually since Node's FormData may not be available in all environments
            const filename = `screenshot_${Date.now()}.${mimeType.split('/')[1] || 'png'}`;
            const attachmentName = `Screenshot_${new Date().toISOString().replace(/[:.]/g, '-')}`;

            // Create multipart form data body manually
            const multipartBody = Buffer.concat([
                // Auth parameters
                Buffer.from(`--${boundary}\r\n`),
                Buffer.from(`Content-Disposition: form-data; name="key"\r\n\r\n`),
                Buffer.from(`${this.apiKey}\r\n`),

                Buffer.from(`--${boundary}\r\n`),
                Buffer.from(`Content-Disposition: form-data; name="token"\r\n\r\n`),
                Buffer.from(`${this.token}\r\n`),

                // Attachment name
                Buffer.from(`--${boundary}\r\n`),
                Buffer.from(`Content-Disposition: form-data; name="name"\r\n\r\n`),
                Buffer.from(`${attachmentName}\r\n`),

                // File content
                Buffer.from(`--${boundary}\r\n`),
                Buffer.from(`Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`),
                Buffer.from(`Content-Type: ${mimeType}\r\n\r\n`),
                buffer,
                Buffer.from(`\r\n--${boundary}--\r\n`)
            ]);

            // Log what we're doing
            this.log({
                level: 'DEBUG',
                operation: 'ADD_BASE64_IMAGE_ATTACHMENT_DETAIL',
                message: `Uploading file directly using multipart/form-data`,
                details: {
                    mimeType,
                    filename,
                    bodySize: multipartBody.length,
                    endpoint: `/cards/${cardId}/attachments`
                }
            });

            // Make a direct fetch request with the proper headers
            const response = await fetch(`${TRELLO_API_URL}/cards/${cardId}/attachments`, {
                method: 'POST',
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${boundary}`,
                    'Content-Length': multipartBody.length.toString()
                },
                body: multipartBody
            });

            if (!response.ok) {
                const errorText = await response.text();
                this.log({
                    level: 'ERROR',
                    operation: 'ADD_BASE64_IMAGE_ATTACHMENT_ERROR',
                    message: `Trello API error response: ${response.status} ${response.statusText}`,
                    details: {
                        status: response.status,
                        responseText: errorText.substring(0, 500) // Limit response size in logs
                    }
                });
                throw new Error(`Trello API error (${response.status}): ${errorText.substring(0, 500)}`);
            }

            this.log({
                level: 'INFO',
                operation: 'ADD_BASE64_IMAGE_ATTACHMENT_SUCCESS',
                message: `Successfully added file attachment to card ${cardId}`
            });

            return;
        } catch (error) {
            // If all fails, try one more approach - uploading to an external service and linking
            try {
                this.log({
                    level: 'INFO',
                    operation: 'ADD_BASE64_IMAGE_ATTACHMENT_FINAL_ATTEMPT',
                    message: `Trying to add attachment by URL - will use mocked URL (shorter path)`
                });

                // As a last resort, add a text attachment explaining the issue
                await this.fetchTrello(`/cards/${cardId}/attachments`, 'POST', {
                    name: `Screenshot (Error: Unable to upload, size: ${Math.round(base64Data.length / 1024)}KB)`,
                    url: "https://trello.com" // Use Trello's own domain as a placeholder
                });

                this.log({
                    level: 'INFO',
                    operation: 'ADD_BASE64_IMAGE_ATTACHMENT_FALLBACK_COMPLETE',
                    message: `Added placeholder attachment with error information`
                });
            } catch (finalError) {
                // Just log this final error but don't rethrow
                this.log({
                    level: 'ERROR',
                    operation: 'ADD_BASE64_IMAGE_FINAL_ATTEMPT_FAILED',
                    message: `Even fallback attachment failed`,
                    details: {
                        error: finalError instanceof Error ? finalError.message : 'Unknown error'
                    }
                });
            }

            this.log({
                level: 'ERROR',
                operation: 'ADD_BASE64_IMAGE_ATTACHMENT_ERROR',
                message: `Failed to add image attachment to card ${cardId}`,
                details: {
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            });
            throw error;
        }
    }
} 