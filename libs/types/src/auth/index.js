"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = exports.Permission = exports.ROLE_HIERARCHY = exports.OTPStatus = exports.OTPPurpose = exports.UserStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SYSTEM_ADMIN"] = "SYSTEM_ADMIN";
    UserRole["SCHOOL_OWNER"] = "SCHOOL_OWNER";
    UserRole["SCHOOL_HEAD"] = "SCHOOL_HEAD";
    UserRole["SCHOOL_ADMIN"] = "SCHOOL_ADMIN";
    UserRole["TEACHER"] = "TEACHER";
    UserRole["PARENT"] = "PARENT";
    UserRole["STUDENT"] = "STUDENT";
    UserRole["ACCOUNTANT"] = "ACCOUNTANT";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["INACTIVE"] = "INACTIVE";
    UserStatus["PENDING"] = "PENDING";
    UserStatus["SUSPENDED"] = "SUSPENDED";
    UserStatus["DELETED"] = "DELETED";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var OTPPurpose;
(function (OTPPurpose) {
    OTPPurpose["REGISTRATION"] = "REGISTRATION";
    OTPPurpose["PASSWORD_RESET"] = "PASSWORD_RESET";
    OTPPurpose["EMAIL_VERIFICATION"] = "EMAIL_VERIFICATION";
    OTPPurpose["STAFF_ONBOARDING"] = "STAFF_ONBOARDING";
    OTPPurpose["STUDENT_LINKING"] = "STUDENT_LINKING";
})(OTPPurpose || (exports.OTPPurpose = OTPPurpose = {}));
var OTPStatus;
(function (OTPStatus) {
    OTPStatus["PENDING"] = "PENDING";
    OTPStatus["USED"] = "USED";
    OTPStatus["EXPIRED"] = "EXPIRED";
})(OTPStatus || (exports.OTPStatus = OTPStatus = {}));
// Role hierarchy and permissions
exports.ROLE_HIERARCHY = {
    [UserRole.SYSTEM_ADMIN]: [], // Top level, no superiors
    [UserRole.SCHOOL_OWNER]: [UserRole.SYSTEM_ADMIN],
    [UserRole.SCHOOL_HEAD]: [UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_OWNER],
    [UserRole.SCHOOL_ADMIN]: [UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_OWNER, UserRole.SCHOOL_HEAD],
    [UserRole.TEACHER]: [UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_OWNER, UserRole.SCHOOL_HEAD, UserRole.SCHOOL_ADMIN],
    [UserRole.ACCOUNTANT]: [UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_OWNER, UserRole.SCHOOL_HEAD, UserRole.SCHOOL_ADMIN],
    [UserRole.PARENT]: [UserRole.SYSTEM_ADMIN],
    [UserRole.STUDENT]: [UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_OWNER, UserRole.SCHOOL_HEAD, UserRole.SCHOOL_ADMIN, UserRole.TEACHER]
};
var Permission;
(function (Permission) {
    // System-wide permissions
    Permission["MANAGE_SYSTEM"] = "MANAGE_SYSTEM";
    Permission["VIEW_SYSTEM_LOGS"] = "VIEW_SYSTEM_LOGS";
    // School management
    Permission["CREATE_SCHOOL"] = "CREATE_SCHOOL";
    Permission["MANAGE_SCHOOL"] = "MANAGE_SCHOOL";
    Permission["VIEW_SCHOOL"] = "VIEW_SCHOOL";
    // User management
    Permission["CREATE_USER"] = "CREATE_USER";
    Permission["MANAGE_USER"] = "MANAGE_USER";
    Permission["VIEW_USER"] = "VIEW_USER";
    // Academic management
    Permission["MANAGE_CLASSES"] = "MANAGE_CLASSES";
    Permission["MANAGE_GRADES"] = "MANAGE_GRADES";
    Permission["VIEW_GRADES"] = "VIEW_GRADES";
    // Financial management
    Permission["MANAGE_PAYMENTS"] = "MANAGE_PAYMENTS";
    Permission["VIEW_PAYMENTS"] = "VIEW_PAYMENTS";
    // Communication
    Permission["SEND_NOTIFICATIONS"] = "SEND_NOTIFICATIONS";
    Permission["MANAGE_COMMUNICATIONS"] = "MANAGE_COMMUNICATIONS";
})(Permission || (exports.Permission = Permission = {}));
exports.ROLE_PERMISSIONS = {
    [UserRole.SYSTEM_ADMIN]: Object.values(Permission),
    [UserRole.SCHOOL_OWNER]: [
        Permission.MANAGE_SCHOOL,
        Permission.VIEW_SCHOOL,
        Permission.CREATE_USER,
        Permission.MANAGE_USER,
        Permission.VIEW_USER,
        Permission.MANAGE_PAYMENTS,
        Permission.VIEW_PAYMENTS,
        Permission.SEND_NOTIFICATIONS
    ],
    [UserRole.SCHOOL_HEAD]: [
        Permission.VIEW_SCHOOL,
        Permission.MANAGE_CLASSES,
        Permission.MANAGE_GRADES,
        Permission.VIEW_GRADES,
        Permission.VIEW_PAYMENTS,
        Permission.SEND_NOTIFICATIONS
    ],
    [UserRole.SCHOOL_ADMIN]: [
        Permission.VIEW_SCHOOL,
        Permission.CREATE_USER,
        Permission.MANAGE_USER,
        Permission.MANAGE_CLASSES,
        Permission.VIEW_GRADES,
        Permission.SEND_NOTIFICATIONS
    ],
    [UserRole.TEACHER]: [
        Permission.MANAGE_GRADES,
        Permission.VIEW_GRADES,
        Permission.SEND_NOTIFICATIONS
    ],
    [UserRole.ACCOUNTANT]: [
        Permission.MANAGE_PAYMENTS,
        Permission.VIEW_PAYMENTS
    ],
    [UserRole.PARENT]: [
        Permission.VIEW_GRADES,
        Permission.VIEW_PAYMENTS
    ],
    [UserRole.STUDENT]: [
        Permission.VIEW_GRADES
    ]
};
//# sourceMappingURL=index.js.map