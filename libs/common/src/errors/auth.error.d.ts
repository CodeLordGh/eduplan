export declare const createAuthenticationError: (message: string, details?: unknown) => Error & {
    toJSON: () => {
        error: {
            message: string;
            code: string;
            statusCode: number;
            details?: unknown;
            stack?: string;
        };
    };
};
export declare const createInvalidCredentialsError: (details?: unknown) => Error & {
    toJSON: () => {
        error: {
            message: string;
            code: string;
            statusCode: number;
            details?: unknown;
            stack?: string;
        };
    };
};
export declare const createTokenExpiredError: (details?: unknown) => Error & {
    toJSON: () => {
        error: {
            message: string;
            code: string;
            statusCode: number;
            details?: unknown;
            stack?: string;
        };
    };
};
export declare const createInvalidTokenError: (details?: unknown) => Error & {
    toJSON: () => {
        error: {
            message: string;
            code: string;
            statusCode: number;
            details?: unknown;
            stack?: string;
        };
    };
};
export declare const createUnauthorizedError: (message: string, details?: unknown) => Error & {
    toJSON: () => {
        error: {
            message: string;
            code: string;
            statusCode: number;
            details?: unknown;
            stack?: string;
        };
    };
};
export declare const createOTPError: (message: string, details?: unknown) => Error & {
    toJSON: () => {
        error: {
            message: string;
            code: string;
            statusCode: number;
            details?: unknown;
            stack?: string;
        };
    };
};
export declare const createOTPExpiredError: (details?: unknown) => Error & {
    toJSON: () => {
        error: {
            message: string;
            code: string;
            statusCode: number;
            details?: unknown;
            stack?: string;
        };
    };
};
export declare const createInvalidOTPError: (details?: unknown) => Error & {
    toJSON: () => {
        error: {
            message: string;
            code: string;
            statusCode: number;
            details?: unknown;
            stack?: string;
        };
    };
};
//# sourceMappingURL=auth.error.d.ts.map