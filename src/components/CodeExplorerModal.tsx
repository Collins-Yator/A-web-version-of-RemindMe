import React, { useState } from 'react';
import { X, Code2, Copy, Check, FileCode, Server, Database, Shield, Cpu, Layers } from 'lucide-react';

interface CodeExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CodeFile {
  name: string;
  path: string;
  category: string;
  language: string;
  description: string;
  code: string;
}

const FILES: CodeFile[] = [
  {
    name: 'ReminderScheduler.kt',
    path: 'src/main/kotlin/.../scheduler/ReminderScheduler.kt',
    category: 'Scheduler',
    language: 'kotlin',
    description: 'Scheduled task processing due reminders with database-level idempotency to prevent duplicate emails',
    code: `@Component
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
        val activeEvents = eventRepository.findUpcomingActiveEventsWithReminders(
            now.minus(Duration.ofHours(2))
        )

        for (event in activeEvents) {
            val nextStart = recurrenceService.getNextOccurrence(event, now)
            if (nextStart.isBefore(now.minus(Duration.ofHours(2)))) continue

            for (reminder in event.reminders) {
                val triggerInstant = nextStart.minus(Duration.ofMinutes(reminder.minutesBefore.toLong()))

                if (!now.isBefore(triggerInstant)) {
                    if (reminder.emailEnabled) {
                        dispatchEmailReminder(event, reminder, nextStart, now)
                    }
                }
            }
        }
    }

    private fun dispatchEmailReminder(event: Event, reminder: Reminder, effectiveStart: Instant, now: Instant) {
        // Enforce idempotency: prevent duplicate notification delivery
        val alreadyDelivered = deliveryRepository.existsByReminderIdAndScheduledForAndNotificationType(
            reminder.id, effectiveStart, NotificationType.EMAIL
        )
        if (alreadyDelivered) return

        val user = userRepository.findById(event.userId).orElse(null) ?: return
        if (!user.emailEnabled) return

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

        val success = emailService.sendReminderEmail(user, event, reminder.minutesBefore)
        delivery.status = if (success) DeliveryStatus.SENT else DeliveryStatus.FAILED
        delivery.sentAt = if (success) Instant.now() else null
        deliveryRepository.save(delivery)
    }
}`,
  },
  {
    name: 'EmailService.kt',
    path: 'src/main/kotlin/.../email/EmailService.kt',
    category: 'Email',
    language: 'kotlin',
    description: 'Transactional HTML email delivery with responsive styling and configuration parameters',
    code: `@Service
class SpringMailReminderEmailService(
    private val mailSender: JavaMailSender,
    @Value("\${remindme.email.sender:yatorcollins44@gmail.com}") private val defaultSender: String
) : EmailService {

    private val logger = LoggerFactory.getLogger(SpringMailReminderEmailService::class.java)

    override fun sendReminderEmail(user: User, event: Event, minutesBefore: Int): Boolean {
        return try {
            val message = mailSender.createMimeMessage()
            val helper = MimeMessageHelper(message, true, "UTF-8")

            helper.setFrom(defaultSender)
            helper.setTo(user.email)
            helper.setSubject("RemindMe: Upcoming Event — \${event.title}")

            val htmlBody = buildHtmlEmailContent(user, event, minutesBefore)
            helper.setText(htmlBody, true)

            mailSender.send(message)
            logger.info("Successfully sent reminder email for event ID: {} to {}", event.id, user.email)
            true
        } catch (e: Exception) {
            logger.error("Failed to send reminder email: {}", e.message)
            false
        }
    }
}`,
  },
  {
    name: 'Event.kt & Entities',
    path: 'src/main/kotlin/.../entity/Event.kt',
    category: 'JPA Entities',
    language: 'kotlin',
    description: 'JPA Entity definitions with JPA relationships, indexes, and recurrence mappings',
    code: `@Entity
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

    @OneToMany(mappedBy = "event", cascade = [CascadeType.ALL], orphanRemoval = true)
    var reminders: MutableList<Reminder> = mutableListOf(),

    val createdAt: Instant = Instant.now(),
    var updatedAt: Instant = Instant.now()
)`,
  },
  {
    name: 'SecurityConfig.kt',
    path: 'src/main/kotlin/.../security/SecurityConfig.kt',
    category: 'Security',
    language: 'kotlin',
    description: 'Spring Security 6 with Google OAuth2 login and principal resolution',
    code: `@Configuration
@EnableWebSecurity
class SecurityConfig(
    private val customOAuth2UserService: CustomOAuth2UserService
) {
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .authorizeHttpRequests { auth ->
                auth
                    .requestMatchers("/", "/login", "/css/**", "/js/**", "/actuator/health").permitAll()
                    .anyRequest().authenticated()
            }
            .oauth2Login { oauth2 ->
                oauth2
                    .loginPage("/login")
                    .userInfoEndpoint { it.userService(customOAuth2UserService) }
                    .defaultSuccessUrl("/dashboard", true)
            }
            .csrf { it.ignoringRequestMatchers("/api/**") }

        return http.build()
    }
}`,
  },
  {
    name: 'V1__init_schema.sql',
    path: 'src/main/resources/db/migration/V1__init_schema.sql',
    category: 'Database / Flyway',
    language: 'sql',
    description: 'Flyway PostgreSQL schema migration with performance indexes and unique constraints',
    code: `CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    google_id VARCHAR(128) UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    timezone VARCHAR(64) NOT NULL DEFAULT 'Africa/Nairobi',
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date_time TIMESTAMP WITH TIME ZONE,
    location VARCHAR(255),
    category_id VARCHAR(64) REFERENCES categories(id) ON DELETE SET NULL,
    recurrence_type VARCHAR(32) NOT NULL DEFAULT 'NONE',
    completed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS notification_deliveries (
    id VARCHAR(64) PRIMARY KEY,
    reminder_id VARCHAR(64) NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
    event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    notification_type VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    CONSTRAINT uq_reminder_delivery UNIQUE (reminder_id, scheduled_for, notification_type)
);`,
  },
  {
    name: 'build.gradle.kts',
    path: 'build.gradle.kts',
    category: 'Build & Dependencies',
    language: 'kotlin',
    description: 'Gradle Kotlin DSL with Spring Boot 3, Flyway, PostgreSQL, JPA, Mail, and MockK',
    code: `plugins {
    id("org.springframework.boot") version "3.3.3"
    id("io.spring.dependency-management") version "1.1.6"
    kotlin("jvm") version "1.9.25"
    kotlin("plugin.spring") version "1.9.25"
    kotlin("plugin.jpa") version "1.9.25"
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-thymeleaf")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-mail")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-oauth2-client")

    implementation("org.postgresql:postgresql")
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.mockk:mockk:1.13.10")
}`,
  },
];

export const CodeExplorerModal: React.FC<CodeExplorerModalProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(FILES[0]);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-5xl my-8 bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Spring Boot 3 + Kotlin Architecture Explorer
              </h2>
              <p className="text-xs text-slate-400">
                Production-grade backend engineering codebase saved in <code className="text-blue-300">/remindme</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Explorer Body: 2 panes */}
        <div className="grid grid-cols-1 md:grid-cols-4 flex-1 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-800">
          {/* File Tree */}
          <div className="md:col-span-1 overflow-y-auto p-3 space-y-1 bg-slate-950/70">
            <div className="px-2 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Project Components
            </div>

            {FILES.map((file) => {
              const isSelected = selectedFile.name === file.name;
              return (
                <button
                  key={file.name}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left p-2.5 rounded-lg transition-colors flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <FileCode className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate text-slate-200">{file.name}</p>
                    <p className="text-[10px] text-slate-500">{file.category}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Code Viewer */}
          <div className="md:col-span-3 flex flex-col overflow-hidden bg-slate-900">
            {/* File Info Bar */}
            <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-blue-400">{selectedFile.path}</span>
                <p className="text-xs text-slate-400 mt-0.5">{selectedFile.description}</p>
              </div>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                {selectedFile.language}
              </span>
            </div>

            {/* Code Content */}
            <div className="flex-1 overflow-auto p-6 font-mono text-xs leading-relaxed text-slate-300 bg-slate-950/80">
              <pre className="whitespace-pre">
                <code>{selectedFile.code}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
