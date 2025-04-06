import { TrelloCard } from '../types';

const TRELLO_API_URL = 'https://api.trello.com/1';

interface CreateCardParams {
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

        // Create the card first with basic parameters
        const card = await this.fetchTrello<TrelloCard>('/cards', 'POST', {
            name,
            desc,
            idList
        });

        // If there's a URL source, add it as an attachment
        if (urlSource) {
            await this.addAttachmentToCard(card.id, urlSource);
        }

        // If there are labels, add them
        if (idLabels && idLabels.length > 0) {
            for (const labelId of idLabels) {
                await this.addLabelToCard(card.id, labelId);
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
} 