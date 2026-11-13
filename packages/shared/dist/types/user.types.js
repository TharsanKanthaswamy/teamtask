"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamRole = exports.AdminLevel = exports.UserStatus = void 0;
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["INACTIVE"] = "INACTIVE";
    UserStatus["SUSPENDED"] = "SUSPENDED";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var AdminLevel;
(function (AdminLevel) {
    AdminLevel["SUPER_ADMIN"] = "SUPER_ADMIN";
})(AdminLevel || (exports.AdminLevel = AdminLevel = {}));
var TeamRole;
(function (TeamRole) {
    TeamRole["TEAM_LEAD"] = "TEAM_LEAD";
    TeamRole["TEAM_MEMBER"] = "TEAM_MEMBER";
})(TeamRole || (exports.TeamRole = TeamRole = {}));
//# sourceMappingURL=user.types.js.map