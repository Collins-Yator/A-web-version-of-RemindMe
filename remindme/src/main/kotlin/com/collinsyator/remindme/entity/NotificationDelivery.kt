package com.collinsyator.remindme.entity

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "notification_deliveries", uniqueConstraints = [
    UniqueConstraint(name = "uq_reminder_delivery", columnNames = ["reminder_id", "scheduled_for", "notification_type"])
])
data class NotificationDelivery(
    @Id
    val id: String,

    @Column(name = "reminder_id", nullable = false)
    val reminderId: String,

    @Column(name = "event_id", nullable = false)
    val eventId: String,

    @Column(name = "scheduled_for", nullable = false)
    val scheduledFor: Instant,

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false)
    val notificationType: NotificationType,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: DeliveryStatus = DeliveryStatus.PENDING,

    @Column(name = "sent_at")
    var sentAt: Instant? = null,

    @Column(name = "error_message", columnDefinition = "TEXT")
    var errorMessage: String? = null,

    @Column(name = "recipient_email")
    var recipientEmail: String? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now()
)
