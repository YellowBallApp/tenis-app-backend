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

