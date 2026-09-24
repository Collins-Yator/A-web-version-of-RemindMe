package com.collinsyator.remindme.scheduler

import com.collinsyator.remindme.email.EmailService
import com.collinsyator.remindme.entity.*
import com.collinsyator.remindme.repository.*
import com.collinsyator.remindme.service.RecurrenceService
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Duration
import java.time.Instant
import java.util.UUID

@Component
class ReminderScheduler(
    private val eventRepository: EventRepository,
    private val userRepository: UserRepository,
    private val deliveryRepository: NotificationDeliveryRepository,
    private val recurrenceService: RecurrenceService,
    private val emailService: EmailService
) {
    private val logger = LoggerFactory.getLogger(ReminderScheduler::class.java)

    @Scheduled(cron = "\${remindme.scheduler.cron:0 * * * * *}")
    @Transactional
    fun processDueReminders() {
        val now = Instant.now()
        logger.debug("Running reminder check cycle at {}", now)

        val activeEvents = eventRepository.findUpcomingActiveEventsWithReminders(
            now.minus(Duration.ofHours(2))
        )

        for (event in activeEvents) {
            val nextStart = recurrenceService.getNextOccurrence(event, now)

            // Skip if event has already occurred more than 2 hours ago
            if (nextStart.isBefore(now.minus(Duration.ofHours(2)))) {
                continue
            }

            for (reminder in event.reminders) {
                val triggerInstant = nextStart.minus(Duration.ofMinutes(reminder.minutesBefore.toLong()))

                // Check if trigger time is due (triggerInstant <= now)
                if (!now.isBefore(triggerInstant)) {
                    // Check Email Delivery
                    if (reminder.emailEnabled) {
                        dispatchEmailReminder(event, reminder, nextStart, now)
                    }
                }
            }
        }
    }

    private fun dispatchEmailReminder(
        event: Event,
        reminder: Reminder,
        effectiveStart: Instant,
        now: Instant
    ) {
        // Enforce strict idempotency: check if delivery record already exists
        val alreadyDelivered = deliveryRepository.existsByReminderIdAndScheduledForAndNotificationType(
            reminder.id,
            effectiveStart,
            NotificationType.EMAIL
        )

        if (alreadyDelivered) {
            return
        }

        val user = userRepository.findById(event.userId).orElse(null) ?: run {
            logger.warn("Skipping reminder delivery: User not found for event ID {}", event.id)
            return
        }

        if (!user.emailEnabled) {
            return
        }

        // Initialize delivery record with PROCESSING state
        val delivery = NotificationDelivery(
            id = "del_" + UUID.randomUUID().toString().replace("-", "").take(16),
            reminderId = reminder.id,
            eventId = event.id,
            scheduledFor = effectiveStart,
            notificationType = NotificationType.EMAIL,
            status = DeliveryStatus.PROCESSING,
            recipientEmail = user.email
        )
        deliveryRepository.save(delivery)

        // Dispatch email
        val success = emailService.sendReminderEmail(user, event, reminder.minutesBefore)

        if (success) {
            delivery.status = DeliveryStatus.SENT
            delivery.sentAt = Instant.now()
        } else {
            delivery.status = DeliveryStatus.FAILED
            delivery.errorMessage = "Failed to transmit message via configured mail transport"
        }

        deliveryRepository.save(delivery)
    }
}
