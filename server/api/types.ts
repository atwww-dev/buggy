export interface FeedbackRequest {
    title: string;
    description: string;
    category: string;
    priority: string;
    steps: string;
    screenshot: string;
    url: string;
    browser: string;
}

export interface TrelloCard {
    id: string;
    [key: string]: any;
}

export interface ErrorResponse {
    success: false;
    error: string;
}

export interface SuccessResponse {
    success: true;
    cardId?: string;
} 