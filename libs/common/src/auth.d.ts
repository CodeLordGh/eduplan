export declare function hashPassword(password: string): Promise<string>;
export declare function verifyPassword(password: string, hash: string): Promise<boolean>;
export declare function generateJWT(payload: object): string;
export declare function verifyJWT<T>(token: string): T;
//# sourceMappingURL=auth.d.ts.map