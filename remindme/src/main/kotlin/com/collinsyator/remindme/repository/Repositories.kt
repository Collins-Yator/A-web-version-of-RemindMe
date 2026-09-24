package com.collinsyator.remindme.repository

import com.collinsyator.remindme.entity.*
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional

@Repository
interface UserRepository : JpaRepository<User, String> {
    fun findByEmail(email: String): Optional<User>
    fun findByGoogleId(googleId: String): Optional<User>
}

@Repository
interface CategoryRepository : JpaRepository<Category, String> {
    fun findByUserIdOrUserIdIsNullOrderByNameAsc(userId: String): List<Category>
    fun findByIdAndUserId(id: String, userId: String): Optional<Category>
    fun existsByUserIdAndNameIgnoreCase(userId: String, name: String): Boolean
}

@Repository
interface EventRepository : JpaRepository<Event, String> {
    fun findByIdAndUserId(id: String, userId: String): Optional<Event>

    fun findAllByUserIdOrderByStartDateTimeAsc(userId: String): List<Event>

    fun findAllByUserIdAndCompletedOrderByStartDateTimeAsc(
        userId: String,
        completed: Boolean
    ): List<Event>

    @Query("""
        SELECT e FROM Event e 
        WHERE e.userId = :userId 
        AND e.startDateTime >= :start 
        AND e.startDateTime <= :end 
        ORDER BY e.startDateTime ASC
    """)
    fun findEventsInRange(
        @Param("userId") userId: String,
        @Param("start") start: Instant,
        @Param("end") end: Instant
    ): List<Event>

    @Query("""
        SELECT e FROM Event e 
        WHERE e.userId = :userId 
        AND (
            LOWER(e.title) LIKE LOWER(CONCAT('%', :query, '%')) 
            OR LOWER(e.description) LIKE LOWER(CONCAT('%', :query, '%')) 
            OR LOWER(e.location) LIKE LOWER(CONCAT('%', :query, '%'))
        )
        ORDER BY e.startDateTime ASC
    """)
    fun searchEvents(
        @Param("userId") userId: String,
        @Param("query") query: String,
        pageable: Pageable
    ): Page<Event>

    @Query("""
        SELECT e FROM Event e 
        LEFT JOIN FETCH e.reminders 
        WHERE e.completed = false 
        AND e.startDateTime >= :minStart
    """)
    fun findUpcomingActiveEventsWithReminders(@Param("minStart") minStart: Instant): List<Event>
}

@Repository
interface ReminderRepository : JpaRepository<Reminder, String> {
    fun findByEventId(eventId: String): List<Reminder>
}

@Repository
interface NotificationDeliveryRepository : JpaRepository<NotificationDelivery, String> {
    fun existsByReminderIdAndScheduledForAndNotificationType(
        reminderId: String,
        scheduledFor: Instant,
        notificationType: NotificationType
    ): Boolean

    fun findTop50ByOrderByCreatedAtDesc(): List<NotificationDelivery>
}
