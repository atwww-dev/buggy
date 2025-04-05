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
        this.apiKey = apiKey;
        this.token = token;
        this.log({
            level: 'INFO',
            operation: 'INIT',
            message: 'TrelloService initialized',
            details: { apiKey: this.maskApiKey(apiKey) }
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

    private async fetchTrello<T>(
        endpoint: string,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
        params?: Record<string, string | string[]>
    ): Promise<T> {
        const url = new URL(`${TRELLO_API_URL}${endpoint}`);
        const maskedParams = params ? { ...params } : undefined;
        if (maskedParams?.idLabels) {
            maskedParams.idLabels = ['[REDACTED]'];
        }

        this.log({
            level: 'DEBUG',
            operation: 'API_REQUEST',
            message: `Making ${method} request to ${endpoint}`,
            details: {
                endpoint,
                method,
                params: maskedParams
            }
        });

        // Add authentication parameters
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

        try {
            const response = await fetch(url.toString(), {
                method,
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                this.log({
                    level: 'ERROR',
                    operation: 'API_ERROR',
                    message: `Trello API error: ${response.status} ${response.statusText}`,
                    details: {
                        status: response.status,
                        statusText: response.statusText,
                        error: errorText,
                        url: url.toString()
                    }
                });
                throw new Error(`Trello API error: ${errorText}`);
            }

            const data = await response.json();
            this.log({
                level: 'DEBUG',
                operation: 'API_RESPONSE',
                message: `Successfully received response from ${endpoint}`,
                details: {
                    status: response.status,
                    responseType: typeof data
                }
            });

            return data;
        } catch (error) {
            this.log({
                level: 'ERROR',
                operation: 'API_ERROR',
                message: 'Failed to complete Trello API request',
                details: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    url: url.toString()
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

        const queryParams: Record<string, string | string[]> = {
            name,
            desc,
            idList,
        };

        if (urlSource) {
            queryParams.urlSource = urlSource;
        }

        if (idLabels && idLabels.length > 0) {
            queryParams.idLabels = idLabels;
        }

        try {
            const card = await this.fetchTrello<TrelloCard>('/cards', 'POST', queryParams);
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
        } catch (error) {
            this.log({
                level: 'ERROR',
                operation: 'CREATE_CARD_FAILED',
                message: 'Failed to create Trello card',
                details: {
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            });
            throw error;
        }
    }

    async getCard(cardId: string): Promise<TrelloCard> {
        this.log({
            level: 'DEBUG',
            operation: 'GET_CARD',
            message: `Fetching card details for ${cardId}`
        });

        try {
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
        } catch (error) {
            this.log({
                level: 'ERROR',
                operation: 'GET_CARD_FAILED',
                message: `Failed to fetch card ${cardId}`,
                details: {
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            });
            throw error;
        }
    }

    async addLabelToCard(cardId: string, labelId: string): Promise<void> {
        this.log({
            level: 'INFO',
            operation: 'ADD_LABEL',
            message: `Adding label to card ${cardId}`,
            details: { labelId }
        });

        try {
            await this.fetchTrello(`/cards/${cardId}/idLabels`, 'POST', { value: labelId });
            this.log({
                level: 'INFO',
                operation: 'ADD_LABEL_SUCCESS',
                message: `Successfully added label to card ${cardId}`
            });
        } catch (error) {
            this.log({
                level: 'ERROR',
                operation: 'ADD_LABEL_FAILED',
                message: `Failed to add label to card ${cardId}`,
                details: {
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            });
            throw error;
        }
    }

    async addAttachmentToCard(cardId: string, url: string): Promise<void> {
        this.log({
            level: 'INFO',
            operation: 'ADD_ATTACHMENT',
            message: `Adding attachment to card ${cardId}`,
            details: { url: url.substring(0, 50) + '...' }
        });

        try {
            await this.fetchTrello(`/cards/${cardId}/attachments`, 'POST', { url });
            this.log({
                level: 'INFO',
                operation: 'ADD_ATTACHMENT_SUCCESS',
                message: `Successfully added attachment to card ${cardId}`
            });
        } catch (error) {
            this.log({
                level: 'ERROR',
                operation: 'ADD_ATTACHMENT_FAILED',
                message: `Failed to add attachment to card ${cardId}`,
                details: {
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            });
            throw error;
        }
    }
} 