package com.collinsyator.remindme.service

import com.collinsyator.remindme.dto.*
import com.collinsyator.remindme.entity.*
import com.collinsyator.remindme.repository.*
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.*
import java.time.temporal.TemporalAdjusters
import java.util.UUID

@Service
class RecurrenceService {
    /**
     * Calculates the next occurrence timestamp after referenceInstant based on recurrence rule.
     */
    fun getNextOccurrence(event: Event, referenceInstant: Instant = Instant.now()): Instant {
        if (event.recurrenceType == RecurrenceType.NONE) {
            return event.startDateTime
        }

        if (event.startDateTime.isAfter(referenceInstant)) {
            return event.startDateTime
        }

        val zone = ZoneId.of("UTC")
        var current = event.startDateTime.atZone(zone)
        val ref = referenceInstant.atZone(zone)
        val end = event.recurrenceEndDate?.atZone(zone)

        while (current.toInstant().isBefore(referenceInstant)) {
            current = when (event.recurrenceType) {
                RecurrenceType.WEEKLY -> current.plusWeeks(1)
                RecurrenceType.MONTHLY -> current.plusMonths(1)
                RecurrenceType.YEARLY -> current.plusYears(1)
                RecurrenceType.NONE -> break
            }

            if (end != null && current.isAfter(end)) {
                return event.startDateTime
            }
        }

        return current.toInstant()
    }
}

@Service
@Transactional
class EventService(
    private val eventRepository: EventRepository,
    private val reminderRepository: ReminderRepository,
    private val recurrenceService: RecurrenceService
) {
    fun getEventsForUser(userId: String): List<EventResponse> {
        return eventRepository.findAllByUserIdOrderByStartDateTimeAsc(userId).map { it.toResponse() }
    }

    fun getEventById(id: String, userId: String): EventResponse {
        val event = eventRepository.findByIdAndUserId(id, userId)
            .orElseThrow { NoSuchElementException("Event not found with ID: $id") }
        return event.toResponse()
    }

    fun createEvent(userId: String, request: CreateEventRequest): EventResponse {
        if (request.endDateTime != null && request.endDateTime.isBefore(request.startDateTime)) {
            throw IllegalArgumentException("End time cannot be earlier than start time")
        }

        val eventId = "evt_" + UUID.randomUUID().toString().replace("-", "").take(16)
        val event = Event(
            id = eventId,
            userId = userId,
            title = request.title.trim(),
            description = request.description?.trim(),
            startDateTime = request.startDateTime,
            endDateTime = request.endDateTime,
            location = request.location?.trim(),
            categoryId = request.categoryId,
            recurrenceType = request.recurrenceType,
            recurrenceEndDate = request.recurrenceEndDate,
            completed = false
        )

        val reminders = request.reminders.map { remReq ->
            Reminder(
                id = "rem_" + UUID.randomUUID().toString().replace("-", "").take(16),
                event = event,
                minutesBefore = remReq.minutesBefore,
                emailEnabled = remReq.emailEnabled,
                webNotificationEnabled = remReq.webNotificationEnabled
            )
        }.toMutableList()

        event.reminders = reminders
        val saved = eventRepository.save(event)
        return saved.toResponse()
    }

    fun updateEvent(id: String, userId: String, request: UpdateEventRequest): EventResponse {
        val event = eventRepository.findByIdAndUserId(id, userId)
            .orElseThrow { NoSuchElementException("Event not found with ID: $id") }

        if (request.endDateTime != null && request.endDateTime.isBefore(request.startDateTime)) {
            throw IllegalArgumentException("End time cannot be earlier than start time")
        }

        event.title = request.title.trim()
        event.description = request.description?.trim()
        event.startDateTime = request.startDateTime
        event.endDateTime = request.endDateTime
        event.location = request.location?.trim()
        event.categoryId = request.categoryId
        event.recurrenceType = request.recurrenceType
        event.recurrenceEndDate = request.recurrenceEndDate
        event.completed = request.completed
        if (request.completed && event.completedAt == null) {
            event.completedAt = Instant.now()
        } else if (!request.completed) {
            event.completedAt = null
        }
        event.updatedAt = Instant.now()

        // Replace reminders
        event.reminders.clear()
        request.reminders.forEach { remReq ->
            event.reminders.add(
                Reminder(
                    id = "rem_" + UUID.randomUUID().toString().replace("-", "").take(16),
                    event = event,
                    minutesBefore = remReq.minutesBefore,
                    emailEnabled = remReq.emailEnabled,
                    webNotificationEnabled = remReq.webNotificationEnabled
                )
            )
        }

        return eventRepository.save(event).toResponse()
    }

    fun toggleEventCompletion(id: String, userId: String): EventResponse {
        val event = eventRepository.findByIdAndUserId(id, userId)
            .orElseThrow { NoSuchElementException("Event not found with ID: $id") }

        event.completed = !event.completed
        event.completedAt = if (event.completed) Instant.now() else null
        event.updatedAt = Instant.now()
        return eventRepository.save(event).toResponse()
    }

    fun deleteEvent(id: String, userId: String) {
        val event = eventRepository.findByIdAndUserId(id, userId)
            .orElseThrow { NoSuchElementException("Event not found with ID: $id") }
        eventRepository.delete(event)
    }

    fun searchEvents(userId: String, query: String, pageable: Pageable): Page<EventResponse> {
        return eventRepository.searchEvents(userId, query, pageable).map { it.toResponse() }
    }

    fun getDashboardStats(userId: String, userTimezone: String): DashboardStatsResponse {
        val zone = ZoneId.of(userTimezone)
        val todayStart = LocalDate.now(zone).atStartOfDay(zone).toInstant()
        val todayEnd = LocalDate.now(zone).plusDays(1).atStartOfDay(zone).toInstant()
        val weekEnd = LocalDate.now(zone).plusDays(7).atStartOfDay(zone).toInstant()

        val allEvents = eventRepository.findAllByUserIdOrderByStartDateTimeAsc(userId)

        val eventsToday = allEvents.filter { it.startDateTime >= todayStart && it.startDateTime < todayEnd }
        val completedToday = eventsToday.count { it.completed }.toLong()
        val remainingToday = eventsToday.count { !it.completed }.toLong()
        val upcomingWeek = allEvents.count { !it.completed && it.startDateTime >= todayEnd && it.startDateTime < weekEnd }.toLong()
        val totalActive = allEvents.count { !it.completed }.toLong()

        return DashboardStatsResponse(
            eventsToday = eventsToday.size.toLong(),
            completedToday = completedToday,
            remainingToday = remainingToday,
            upcomingThisWeek = upcomingWeek,
            totalActiveEvents = totalActive
        )
    }

    private fun Event.toResponse(): EventResponse {
        return EventResponse(
            id = this.id,
            title = this.title,
            description = this.description,
            startDateTime = this.startDateTime,
            endDateTime = this.endDateTime,
            location = this.location,
            categoryId = this.categoryId,
            recurrenceType = this.recurrenceType,
            recurrenceEndDate = this.recurrenceEndDate,
            completed = this.completed,
            completedAt = this.completedAt,
            reminders = this.reminders.map {
                ReminderResponse(
                    id = it.id,
                    minutesBefore = it.minutesBefore,
                    emailEnabled = it.emailEnabled,
                    webNotificationEnabled = it.webNotificationEnabled
                )
            },
            createdAt = this.createdAt,
            updatedAt = this.updatedAt
        )
    }
}

@Service
@Transactional
class CategoryService(
    private val categoryRepository: CategoryRepository
) {
    fun getCategoriesForUser(userId: String): List<CategoryResponse> {
        return categoryRepository.findByUserIdOrUserIdIsNullOrderByNameAsc(userId).map {
            CategoryResponse(id = it.id, name = it.name, color = it.color, isDefault = it.isDefault)
        }
    }

    fun createCategory(userId: String, request: CreateCategoryRequest): CategoryResponse {
        if (categoryRepository.existsByUserIdAndNameIgnoreCase(userId, request.name.trim())) {
            throw IllegalArgumentException("A category with the name '${request.name}' already exists")
        }

        val category = Category(
            id = "cat_" + UUID.randomUUID().toString().replace("-", "").take(16),
            userId = userId,
            name = request.name.trim(),
            color = request.color.trim(),
            isDefault = false
        )
        val saved = categoryRepository.save(category)
        return CategoryResponse(saved.id, saved.name, saved.color, saved.isDefault)
    }
}
