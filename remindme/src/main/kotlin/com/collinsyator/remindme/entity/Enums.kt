package com.collinsyator.remindme.entity

enum class RecurrenceType {
    NONE,
    WEEKLY,
    MONTHLY,
    YEARLY
}

enum class NotificationType {
    EMAIL,
    BROWSER
}

enum class DeliveryStatus {
    PENDING,
    PROCESSING,
    SENT,
    FAILED
}
