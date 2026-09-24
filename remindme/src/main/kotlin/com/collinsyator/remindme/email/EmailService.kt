package com.collinsyator.remindme.email

import com.collinsyator.remindme.entity.Event
import com.collinsyator.remindme.entity.User
import jakarta.mail.internet.MimeMessage
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.mail.javamail.MimeMessageHelper
import org.springframework.stereotype.Service
import java.time.ZoneId
import java.time.format.DateTimeFormatter

interface EmailService {
    fun sendReminderEmail(user: User, event: Event, minutesBefore: Int): Boolean
}

@Service
class SpringMailReminderEmailService(
    private val mailSender: JavaMailSender,
    @Value("\${remindme.email.sender:yatorcollins44@gmail.com}") private val defaultSender: String
) : EmailService {

    private val logger = LoggerFactory.getLogger(SpringMailReminderEmailService::class.java)

    override fun sendReminderEmail(user: User, event: Event, minutesBefore: Int): Boolean {
        return try {
            val message: MimeMessage = mailSender.createMimeMessage()
            val helper = MimeMessageHelper(message, true, "UTF-8")

            helper.setFrom(defaultSender)
            helper.setTo(user.email)
            helper.setSubject("RemindMe: Upcoming Event — ${event.title}")

            val htmlBody = buildHtmlEmailContent(user, event, minutesBefore)
            helper.setText(htmlBody, true)

            mailSender.send(message)
            logger.info("Successfully sent reminder email for event ID: {} to {}", event.id, user.email)
            true
        } catch (e: Exception) {
            logger.error("Failed to send reminder email for event ID: {} to {}. Error: {}", event.id, user.email, e.message)
            false
        }
    }

    private fun buildHtmlEmailContent(user: User, event: Event, minutesBefore: Int): String {
        val zone = ZoneId.of(user.timezone)
        val dateFormatter = DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy").withZone(zone)
        val timeFormatter = DateTimeFormatter.ofPattern("h:mm a").withZone(zone)

        val dateStr = dateFormatter.format(event.startDateTime)
        val timeStr = timeFormatter.format(event.startDateTime)

        val timeNotice = when (minutesBefore) {
            60 -> "Your event starts in 1 hour."
            1440 -> "Your event starts tomorrow (in 24 hours)."
            else -> "Your event starts in $minutesBefore minutes."
        }

        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC; color: #0F172A; margin: 0; padding: 24px; }
                .card { max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; }
                .header { background: #0F172A; color: #ffffff; padding: 24px; }
                .title { font-size: 20px; font-weight: bold; margin: 0; }
                .content { padding: 28px; }
                .badge { display: inline-block; padding: 6px 12px; background: #EFF6FF; color: #2563EB; font-weight: 600; font-size: 14px; border-radius: 6px; margin-bottom: 20px; }
                .meta-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
                .meta-row { margin-bottom: 8px; font-size: 15px; }
                .footer { border-top: 1px solid #E2E8F0; padding: 16px 28px; font-size: 12px; color: #64748B; text-align: center; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="header">
                  <h1 class="title">RemindMe</h1>
                  <p style="margin: 4px 0 0; font-size: 12px; color: #94A3B8;">Never forget what matters.</p>
                </div>
                <div class="content">
                  <div class="badge">🔔 $timeNotice</div>
                  <h2 style="margin: 0 0 16px 0; font-size: 22px;">${event.title}</h2>
                  <div class="meta-box">
                    <div class="meta-row">📅 <strong>Date:</strong> $dateStr</div>
                    <div class="meta-row">🕒 <strong>Time:</strong> $timeStr</div>
                    ${if (!event.location.isNullOrBlank()) "<div class=\"meta-row\">📍 <strong>Location:</strong> ${event.location}</div>" else ""}
                  </div>
                  ${if (!event.description.isNullOrBlank()) "<p style=\"font-size: 14px; color: #475569;\"><strong>Notes:</strong><br>${event.description}</p>" else ""}
                </div>
                <div class="footer">
                  Sent to ${user.email} based on your RemindMe notification settings.
                </div>
              </div>
            </body>
            </html>
        """.trimIndent()
    }
}
