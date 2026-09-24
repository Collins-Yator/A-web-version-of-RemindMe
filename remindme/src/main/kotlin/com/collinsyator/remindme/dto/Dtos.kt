package com.collinsyator.remindme.dto

import com.collinsyator.remindme.entity.DeliveryStatus
import com.collinsyator.remindme.entity.NotificationType
import com.collinsyator.remindme.entity.RecurrenceType
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.Size
import java.time.Instant

data class CreateReminderRequest(
    @field:NotNull(message = "Minutes before cannot be null")
    @field:Positive(message = "Minutes before must be greater than zero")
    val minutesBefore: Int,

    val emailEnabled: Boolean = true,
    val webNotificationEnabled: Boolean = true
)

data class ReminderResponse(
    val id: String,
    val minutesBefore: Int,
    val emailEnabled: Boolean,
    val webNotificationEnabled: Boolean
)

data class CreateEventRequest(
    @field:NotBlank(message = "Title cannot be blank")
    @field:Size(max = 255, message = "Title must not exceed 255 characters")
    val title: String,

    val description: String? = null,

    @field:NotNull(message = "Start date time is required")
    val startDateTime: Instant,

    val endDateTime: Instant? = null,

    val location: String? = null,

    val categoryId: String? = null,

    val recurrenceType: RecurrenceType = RecurrenceType.NONE,

    val recurrenceEndDate: Instant? = null,

    val reminders: List<CreateReminderRequest> = emptyList()
)

data class UpdateEventRequest(
    @field:NotBlank(message = "Title cannot be blank")
    val title: String,

    val description: String? = null,

    @field:NotNull(message = "Start date time is required")
    val startDateTime: Instant,

    val endDateTime: Instant? = null,

    val location: String? = null,

    val categoryId: String? = null,

    val recurrenceType: RecurrenceType = RecurrenceType.NONE,

    val recurrenceEndDate: Instant? = null,

    val completed: Boolean = false,

    val reminders: List<CreateReminderRequest> = emptyList()
)

data class EventResponse(
    val id: String,
    val title: String,
    val description: String?,
    val startDateTime: Instant,
    val endDateTime: Instant?,
    val location: String?,
    val categoryId: String?,
    val recurrenceType: RecurrenceType,
    val recurrenceEndDate: Instant?,
    val completed: Boolean,
    val completedAt: Instant?,
    val reminders: List<ReminderResponse>,
    val createdAt: Instant,
    val updatedAt: Instant
)

data class CategoryResponse(
    val id: String,
    val name: String,
    val color: String,
    val isDefault: Boolean
)

data class CreateCategoryRequest(
    @field:NotBlank(message = "Category name is required")
    @field:Size(max = 100, message = "Category name must not exceed 100 characters")
    val name: String,

    @field:NotBlank(message = "Category color is required")
    val color: String
)

data class UserProfileResponse(
    val id: String,
    val email: String,
    val name: String,
    val profileImageUrl: String?,
    val timezone: String,
    val emailEnabled: Boolean,
    val webNotificationEnabled: Boolean,
    val defaultReminderMinutes: Int
)

data class UpdatePreferencesRequest(
    val timezone: String? = null,
    val emailEnabled: Boolean? = null,
    val webNotificationEnabled: Boolean? = null,
    val defaultReminderMinutes: Int? = null
)

data class NotificationDeliveryResponse(
    val id: String,
    val reminderId: String,
    val eventId: String,
    val eventTitle: String,
    val scheduledFor: Instant,
    val notificationType: NotificationType,
    val status: DeliveryStatus,
    val sentAt: Instant?,
    val recipientEmail: String?
)

data class DashboardStatsResponse(
    val eventsToday: Long,
    val completedToday: Long,
    val remainingToday: Long,
    val upcomingThisWeek: Long,
    val totalActiveEvents: Long
)
