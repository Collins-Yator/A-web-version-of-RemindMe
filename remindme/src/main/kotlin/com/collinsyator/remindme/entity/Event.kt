package com.collinsyator.remindme.entity

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "events")
data class Event(
    @Id
    val id: String,

    @Column(name = "user_id", nullable = false)
    val userId: String,

    @Column(nullable = false)
    var title: String,

    @Column(columnDefinition = "TEXT")
    var description: String? = null,

    @Column(name = "start_date_time", nullable = false)
    var startDateTime: Instant,

    @Column(name = "end_date_time")
    var endDateTime: Instant? = null,

    var location: String? = null,

    @Column(name = "category_id")
    var categoryId: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "recurrence_type", nullable = false)
    var recurrenceType: RecurrenceType = RecurrenceType.NONE,

    @Column(name = "recurrence_end_date")
    var recurrenceEndDate: Instant? = null,

    @Column(nullable = false)
    var completed: Boolean = false,

    @Column(name = "completed_at")
    var completedAt: Instant? = null,

    @OneToMany(mappedBy = "event", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    var reminders: MutableList<Reminder> = mutableListOf(),

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()
)
