"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.ReportCardStatus = exports.GradeStatus = exports.EmploymentEligibilityStatus = exports.OTPStatus = exports.EntityType = exports.DocumentType = exports.VerificationStatus = exports.UserStatus = exports.Role = void 0;
const client_1 = require("@prisma/client");
// Re-export everything from the generated Prisma client
__exportStar(require(".prisma/client"), exports);
// Export enums as both types and values
var client_2 = require(".prisma/client");
Object.defineProperty(exports, "Role", { enumerable: true, get: function () { return client_2.Role; } });
Object.defineProperty(exports, "UserStatus", { enumerable: true, get: function () { return client_2.UserStatus; } });
Object.defineProperty(exports, "VerificationStatus", { enumerable: true, get: function () { return client_2.VerificationStatus; } });
Object.defineProperty(exports, "DocumentType", { enumerable: true, get: function () { return client_2.DocumentType; } });
Object.defineProperty(exports, "EntityType", { enumerable: true, get: function () { return client_2.EntityType; } });
Object.defineProperty(exports, "OTPStatus", { enumerable: true, get: function () { return client_2.OTPStatus; } });
Object.defineProperty(exports, "EmploymentEligibilityStatus", { enumerable: true, get: function () { return client_2.EmploymentEligibilityStatus; } });
Object.defineProperty(exports, "GradeStatus", { enumerable: true, get: function () { return client_2.GradeStatus; } });
Object.defineProperty(exports, "ReportCardStatus", { enumerable: true, get: function () { return client_2.ReportCardStatus; } });
// Export the Prisma client instance
exports.prisma = new client_1.PrismaClient();
//# sourceMappingURL=index.js.map