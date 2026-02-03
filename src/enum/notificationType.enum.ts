export enum NotificationType {
    MATCH_CHALLENGE = "match_challenge",
    MATCH_ACCEPTED = "match_accepted",
    MATCH_REJECTED = "match_rejected",
    MATCH_COMPLETED = "match_completed",
    LEAGUE_INVITATION = "league_invitation",
    SYSTEM_NOTIFICATION = "system_notification",
    PENDING_MATCH_REQUEST = "pendingMatchRequest",
    RESERVATION_CREATED = "reservation_created",
    RESERVATION_CANCELLED = "reservation_cancelled",
    RESERVATION_REQUEST = "reservation_request",      // Participantlara: rezervasyon isteği
    RESERVATION_CONFIRMED = "reservation_confirmed",   // PENDING → CONFIRMED olunca hepsine
}

