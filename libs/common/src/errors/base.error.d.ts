export declare class BaseError extends Error {
    readonly name: string;
    readonly cause?: unknown | undefined;
    readonly statusCode: number;
    constructor(name: string, message: string, cause?: unknown | undefined, statusCode?: number);
}
export declare const createError: (message: string, name: string, statusCode?: number, cause?: unknown) => BaseError;
//# sourceMappingURL=base.error.d.ts.map