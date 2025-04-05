import { TrelloCard } from '../types';

const TRELLO_API_URL = 'https://api.trello.com/1';

interface CreateCardParams {
    name: string;
    desc: string;
    idList: string;
    urlSource?: string;
    idLabels?: string[];
}

export class TrelloService {
    private apiKey: string;
    private token: string;

    constructor(apiKey: string, token: string) {
        this.apiKey = apiKey;
        this.token = token;
    }

    private async fetchTrello<T>(
        endpoint: string,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
        body?: any
    ): Promise<T> {
        const url = new URL(`${TRELLO_API_URL}${endpoint}`);
        url.searchParams.append('key', this.apiKey);
        url.searchParams.append('token', this.token);

        const response = await fetch(url.toString(), {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            throw new Error(`Trello API error: ${response.statusText}`);
        }

        return response.json();
    }

    async createCard(params: CreateCardParams): Promise<TrelloCard> {
        const { name, desc, idList, urlSource, idLabels } = params;

        const cardData = {
            name,
            desc,
            idList,
            urlSource,
            idLabels,
        };

        return this.fetchTrello<TrelloCard>('/cards', 'POST', cardData);
    }

    async getCard(cardId: string): Promise<TrelloCard> {
        return this.fetchTrello<TrelloCard>(`/cards/${cardId}`);
    }

    async addLabelToCard(cardId: string, labelId: string): Promise<void> {
        await this.fetchTrello(`/cards/${cardId}/idLabels`, 'POST', { value: labelId });
    }

    async addAttachmentToCard(cardId: string, url: string): Promise<void> {
        await this.fetchTrello(`/cards/${cardId}/attachments`, 'POST', { url });
    }
} 