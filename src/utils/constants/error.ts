import _ from "lodash"


const rawErrors = {
    UNKNOWN_ERROR: {
        code: 1001,
        key: "UNKNOWN_ERROR",
        message: "Unexpected error occurred"
    },
    VALIDATION_ERROR: {
        code: 1002,
        key: "VALIDATION_ERROR",
        message: "Validation error"
    },
    UNAUTHORIZED: {
        code: 1003,
        key: "UNAUTHORIZED",
        message: "Unauthorized access"
    },
    FORBIDDEN: {
        code: 1004,
        key: "FORBIDDEN",
        message: "You do not have permission to perform this action"
    },
    USER_NOT_FOUND: {
        code: 1005,
        key: "USER_NOT_FOUND",
        message: "User not found"
    },
    INVALID_REFRESH_TOKEN: {
        code: 1006,
        key: "INVALID_REFRESH_TOKEN",
        message: "Invalid refresh token"
    },
    INVALID_CREDENTIALS: {
        code: 1007,
        key: "INVALID_CREDENTIALS",
        message: "Invalid credentials" 
    },
    REGISTRATION_FAILED: {
        code: 1008,
        key: "REGISTRATION_FAILED",
        message: "Registration failed"
    },
    USER_ALREADY_EXISTS: {
        code: 1009,
        key: "USER_ALREADY_EXISTS",
        message: "User already exists with this email"
    },
    COACH_NOT_FOUND: {
        code: 1010,
        key: "COACH_NOT_FOUND",
        message: "Coach not found"
    },
    TOKEN_EXPIRED: {
        code: 1011,
        key: "TOKEN_EXPIRED",
        message: "Access token has expired"
    },
    LEAGUE_NOT_FOUND: {
        code: 1012,
        key: "LEAGUE_NOT_FOUND",
        message: "League not found"
    },
    LEAGUE_STANDING_NOT_FOUND: {
        code: 1013,
        key: "LEAGUE_STANDING_NOT_FOUND",
        message: "League standing not found"
    },
    USER_ALREADY_IN_LEAGUE: {
        code: 1014,
        key: "USER_ALREADY_IN_LEAGUE",
        message: "User is already in this league"
    },
    MATCH_HISTORY_NOT_FOUND: {
        code: 1015,
        key: "MATCH_HISTORY_NOT_FOUND",
        message: "Match history not found"
    },
    COMMENT_NOT_FOUND: {
        code: 1016,
        key: "COMMENT_NOT_FOUND",
        message: "Comment not found"
    },
    USER_NOT_IN_MATCH: {
        code: 1017,
        key: "USER_NOT_IN_MATCH",
        message: "User is not a participant in this match"
    },
    UNAUTHORIZED_COMMENT_UPDATE: {
        code: 1018,
        key: "UNAUTHORIZED_COMMENT_UPDATE",
        message: "You are not authorized to update this comment"
    },
    UNAUTHORIZED_COMMENT_DELETE: {
        code: 1019,
        key: "UNAUTHORIZED_COMMENT_DELETE",
        message: "You are not authorized to delete this comment"
    },
    NOTIFICATION_NOT_FOUND: {
        code: 1020,
        key: "NOTIFICATION_NOT_FOUND",
        message: "Notification not found"
    },
    USER_STAR_RATING_TOO_LOW: {
        code: 1021,
        key: "USER_STAR_RATING_TOO_LOW",
        message: "User's star rating is too low for this league"
    },
    USER_STAR_RATING_TOO_HIGH: {
        code: 1022,
        key: "USER_STAR_RATING_TOO_HIGH",
        message: "User's star rating is too high for this league"
    },
    MISSING_REQUIRED_FIELDS: {
        code: 1023,
        key: "MISSING_REQUIRED_FIELDS",
        message: "Required fields are missing"
    },
    CANNOT_CHALLENGE_YOURSELF: {
        code: 1024,
        key: "CANNOT_CHALLENGE_YOURSELF",
        message: "You cannot challenge yourself"
    },
    CHALLENGE_ALREADY_EXISTS: {
        code: 1025,
        key: "CHALLENGE_ALREADY_EXISTS",
        message: "A pending challenge already exists"
    },
    CHALLENGE_NOT_FOUND: {
        code: 1026,
        key: "CHALLENGE_NOT_FOUND",
        message: "Challenge not found"
    },
    CHALLENGE_NOT_PENDING: {
        code: 1027,
        key: "CHALLENGE_NOT_PENDING",
        message: "Challenge is not in pending status"
    },
    CHALLENGE_EXPIRED: {
        code: 1028,
        key: "CHALLENGE_EXPIRED",
        message: "Challenge has expired"
    },
    CHALLENGER_HAS_ACTIVE_CHALLENGE: {
        code: 1029,
        key: "CHALLENGER_HAS_ACTIVE_CHALLENGE",
        message: "You already have an active challenge in this league"
    },
    CHALLENGED_HAS_ACTIVE_CHALLENGE: {
        code: 1030,
        key: "CHALLENGED_HAS_ACTIVE_CHALLENGE",
        message: "This user already has an active challenge in this league"
    },
    CONSECUTIVE_WO_LIMIT_EXCEEDED: {
        code: 1031,
        key: "CONSECUTIVE_WO_LIMIT_EXCEEDED",
        message: "Bu ligde arka arkaya red limitini aştınız. Maç kabul etmeden daha fazla red yapamazsınız."
    }
} as const;


type ErrorKeys = keyof typeof rawErrors;

type Error = {
    [key in ErrorKeys]: {
        code: number,
        key: string,
        message: string
    }
}

const errors: Error = _.cloneDeep(rawErrors);

const errorCodeObj: {[key: number]: boolean} = {}; 
Object.values(errors).forEach(({code}) => {
    if(!errorCodeObj[code]) {
        errorCodeObj[code] = true;
    } else {
        throw Error(`Each error code must be different. Same code: ${code}`)
    }
})

export default errors;
export type { ErrorKeys };

