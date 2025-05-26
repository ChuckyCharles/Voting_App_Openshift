export interface User {
    id: number;
    username: string;
}

export interface Poll {
    id: number;
    title: string;
    description: string;
    created_at: string;
    end_date: string;
    options: PollOption[];
}

export interface PollOption {
    id: number;
    text: string;
    votes?: number;
}

export interface Vote {
    id: number;
    user_id: number;
    option_id: number;
    created_at: string;
}

export interface AuthResponse {
    access_token: string;
    user: User;
} 