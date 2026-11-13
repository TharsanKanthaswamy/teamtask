export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code?: string;
        details?: unknown;
    };
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
    };
}
export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface PaginatedResponse<T> {
    items: T[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
//# sourceMappingURL=api.types.d.ts.map