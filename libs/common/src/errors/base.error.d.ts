type ErrorDetails = {
    message: string;
    code: string;
    statusCode: number;
    details?: unknown;
    stack?: string;
};
export declare const createError: (message: string, code: string, statusCode?: number, details?: unknown) => Error & {
    toJSON: () => {
        error: ErrorDetails;
    };
};
export declare const isError: (error: unknown) => error is Error;
export declare const getErrorMessage: (error: unknown) => string;
export {};
//# sourceMappingURL=base.error.d.ts.map