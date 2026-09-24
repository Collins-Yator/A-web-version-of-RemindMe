package com.collinsyator.remindme.entity

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "reminders")
data class Reminder(
    @Id
    val id: String,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    val event: Event,

    @Column(name = "minutes_before", nullable = false)
    var minutesBefore: Int,

    @Column(name = "email_enabled", nullable = false)
    var emailEnabled: Boolean = true,

    @Column(name = "web_notification_enabled", nullable = false)
    var webNotificationEnabled: Boolean = true,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now()
)
