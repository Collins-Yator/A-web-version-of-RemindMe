package com.collinsyator.remindme

import com.collinsyator.remindme.dto.CreateEventRequest
import com.collinsyator.remindme.dto.CreateReminderRequest
import com.collinsyator.remindme.email.EmailService
import com.collinsyator.remindme.entity.*
import com.collinsyator.remindme.repository.*
import com.collinsyator.remindme.scheduler.ReminderScheduler
import com.collinsyator.remindme.service.EventService
import com.collinsyator.remindme.service.RecurrenceService
import io.mockk.*
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import java.time.Duration
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.*

class RecurrenceServiceTest {

    private val recurrenceService = RecurrenceService()

    @Test
    fun `test NONE recurrence returns original start date`() {
        val start = Instant.parse("2026-09-24T10:00:00Z")
        val event = Event(
            id = "evt_1",
            userId = "usr_1",
            title = "Test",
            startDateTime = start,
            recurrenceType = RecurrenceType.NONE
        )

        val next = recurrenceService.getNextOccurrence(event, Instant.parse("2026-09-24T12:00:00Z"))
        assertEquals(start, next)
    }

    @Test
    fun `test WEEKLY recurrence rolls forward by 7 days`() {
        val start = Instant.parse("2026-09-10T10:00:00Z")
        val event = Event(
            id = "evt_1",
            userId = "usr_1",
            title = "Weekly Meeting",
            startDateTime = start,
            recurrenceType = RecurrenceType.WEEKLY
        )

        val reference = Instant.parse("2026-09-24T05:00:00Z")
        val next = recurrenceService.getNextOccurrence(event, reference)

        assertTrue(next.isAfter(reference) || next == reference)
        assertEquals(Instant.parse("2026-09-24T10:00:00Z"), next)
    }

    @Test
    fun `test recurrence respects recurrence end date`() {
        val start = Instant.parse("2026-09-01T10:00:00Z")
        val end = Instant.parse("2026-09-15T10:00:00Z")
        val event = Event(
            id = "evt_1",
            userId = "usr_1",
            title = "Finite Series",
            startDateTime = start,
            recurrenceType = RecurrenceType.WEEKLY,
            recurrenceEndDate = end
        )

        val reference = Instant.parse("2026-09-25T10:00:00Z")
        val next = recurrenceService.getNextOccurrence(event, reference)
        assertEquals(start, next)
    }
}

class EventServiceTest {

    private val eventRepository = mockk<EventRepository>()
    private val reminderRepository = mockk<ReminderRepository>()
    private val recurrenceService = RecurrenceService()
    private lateinit var eventService: EventService

    @BeforeEach
    fun setup() {
        eventService = EventService(eventRepository, reminderRepository, recurrenceService)
    }

    @Test
    fun `creating event with end time earlier than start time throws IllegalArgumentException`() {
        val start = Instant.now()
        val end = start.minus(Duration.ofHours(1))

        val req = CreateEventRequest(
            title = "Bad Event",
            startDateTime = start,
            endDateTime = end
        )

        val ex = assertThrows<IllegalArgumentException> {
            eventService.createEvent("usr_1", req)
        }
        assertEquals("End time cannot be earlier than start time", ex.message)
    }

    @Test
    fun `creating event successfully saves event and reminders`() {
        val start = Instant.now().plus(Duration.ofDays(1))
        val req = CreateEventRequest(
            title = "Android Project Meeting",
            startDateTime = start,
            reminders = listOf(
                CreateReminderRequest(minutesBefore = 60),
                CreateReminderRequest(minutesBefore = 15)
            )
        )

        every { eventRepository.save(any()) } answers { firstArg() }

        val response = eventService.createEvent("usr_1", req)
        assertEquals("Android Project Meeting", response.title)
        assertEquals(2, response.reminders.size)
    }
}

class ReminderSchedulerTest {

    private val eventRepository = mockk<EventRepository>()
    private val userRepository = mockk<UserRepository>()
    private val deliveryRepository = mockk<NotificationDeliveryRepository>()
    private val recurrenceService = RecurrenceService()
    private val emailService = mockk<EmailService>()
    private lateinit var scheduler: ReminderScheduler

    @BeforeEach
    fun setup() {
        scheduler = ReminderScheduler(
            eventRepository,
            userRepository,
            deliveryRepository,
            recurrenceService,
            emailService
        )
    }

    @Test
    fun `idempotency check prevents duplicate email delivery`() {
        val now = Instant.now()
        val start = now.plus(Duration.ofMinutes(45))
        val event = Event(
            id = "evt_1",
            userId = "usr_1",
            title = "Meeting",
            startDateTime = start
        )
        val reminder = Reminder(
            id = "rem_1",
            event = event,
            minutesBefore = 60,
            emailEnabled = true
        )
        event.reminders = mutableListOf(reminder)

        every { eventRepository.findUpcomingActiveEventsWithReminders(any()) } returns listOf(event)
        // Simulate already delivered
        every {
            deliveryRepository.existsByReminderIdAndScheduledForAndNotificationType("rem_1", any(), NotificationType.EMAIL)
        } returns true

        scheduler.processDueReminders()

        // Verify email was NOT sent and no new record saved
        verify(exactly = 0) { emailService.sendReminderEmail(any(), any(), any()) }
        verify(exactly = 0) { deliveryRepository.save(any()) }
    }
}
