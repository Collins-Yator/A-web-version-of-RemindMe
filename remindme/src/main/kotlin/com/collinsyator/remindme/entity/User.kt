package com.collinsyator.remindme.entity

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "users")
data class User(
    @Id
    val id: String,

    @Column(name = "google_id", unique = true)
    var googleId: String? = null,

    @Column(nullable = false, unique = true)
    var email: String,

    @Column(nullable = false)
    var name: String,

    @Column(name = "profile_image_url")
    var profileImageUrl: String? = null,

    @Column(nullable = false)
    var timezone: String = "Africa/Nairobi",

    @Column(name = "email_enabled", nullable = false)
    var emailEnabled: Boolean = true,

    @Column(name = "web_notification_enabled", nullable = false)
    var webNotificationEnabled: Boolean = true,

    @Column(name = "default_reminder_minutes", nullable = false)
    var defaultReminderMinutes: Int = 60,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()
)
