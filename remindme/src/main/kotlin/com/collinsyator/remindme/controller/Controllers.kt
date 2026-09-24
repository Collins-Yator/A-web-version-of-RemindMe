package com.collinsyator.remindme.controller

import com.collinsyator.remindme.dto.*
import com.collinsyator.remindme.repository.NotificationDeliveryRepository
import com.collinsyator.remindme.repository.UserRepository
import com.collinsyator.remindme.security.SecurityUtils
import com.collinsyator.remindme.service.CategoryService
import com.collinsyator.remindme.service.EventService
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.web.bind.annotation.*
import java.time.Instant

@RestController
@RequestMapping("/api/events")
class EventApiController(
    private val eventService: EventService,
    private val securityUtils: SecurityUtils,
    private val userRepository: UserRepository
) {
    @GetMapping
    fun getAllEvents(): List<EventResponse> {
        val userId = securityUtils.getCurrentUserId()
        return eventService.getEventsForUser(userId)
    }

    @GetMapping("/{id}")
    fun getEventById(@PathVariable id: String): EventResponse {
        val userId = securityUtils.getCurrentUserId()
        return eventService.getEventById(id, userId)
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createEvent(@Valid @RequestBody request: CreateEventRequest): EventResponse {
        val userId = securityUtils.getCurrentUserId()
        return eventService.createEvent(userId, request)
    }

    @PutMapping("/{id}")
    fun updateEvent(
        @PathVariable id: String,
        @Valid @RequestBody request: UpdateEventRequest
    ): EventResponse {
        val userId = securityUtils.getCurrentUserId()
        return eventService.updateEvent(id, userId, request)
    }

    @PatchMapping("/{id}/toggle-complete")
    fun toggleCompletion(@PathVariable id: String): EventResponse {
        val userId = securityUtils.getCurrentUserId()
        return eventService.toggleEventCompletion(id, userId)
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteEvent(@PathVariable id: String) {
        val userId = securityUtils.getCurrentUserId()
        eventService.deleteEvent(id, userId)
    }

    @GetMapping("/search")
    fun searchEvents(
        @RequestParam query: String,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): Page<EventResponse> {
        val userId = securityUtils.getCurrentUserId()
        return eventService.searchEvents(userId, query, PageRequest.of(page, size))
    }

    @GetMapping("/stats")
    fun getDashboardStats(): DashboardStatsResponse {
        val userId = securityUtils.getCurrentUserId()
        val user = userRepository.findById(userId).orElseThrow()
        return eventService.getDashboardStats(userId, user.timezone)
    }
}

@RestController
@RequestMapping("/api/categories")
class CategoryApiController(
    private val categoryService: CategoryService,
    private val securityUtils: SecurityUtils
) {
    @GetMapping
    fun getAllCategories(): List<CategoryResponse> {
        val userId = securityUtils.getCurrentUserId()
        return categoryService.getCategoriesForUser(userId)
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createCategory(@Valid @RequestBody request: CreateCategoryRequest): CategoryResponse {
        val userId = securityUtils.getCurrentUserId()
        return categoryService.createCategory(userId, request)
    }
}

@RestController
@RequestMapping("/api/notifications")
class NotificationApiController(
    private val deliveryRepository: NotificationDeliveryRepository
) {
    @GetMapping("/history")
    fun getDeliveryHistory(): List<NotificationDeliveryResponse> {
        return deliveryRepository.findTop50ByOrderByCreatedAtDesc().map {
            NotificationDeliveryResponse(
                id = it.id,
                reminderId = it.reminderId,
                eventId = it.eventId,
                eventTitle = "Event",
                scheduledFor = it.scheduledFor,
                notificationType = it.notificationType,
                status = it.status,
                sentAt = it.sentAt,
                recipientEmail = it.recipientEmail
            )
        }
    }
}

@Controller
class WebController(
    private val eventService: EventService,
    private val categoryService: CategoryService,
    private val securityUtils: SecurityUtils,
    private val userRepository: UserRepository
) {
    @GetMapping("/")
    fun home(): String {
        return "index"
    }

    @GetMapping("/login")
    fun login(): String {
        return "login"
    }

    @GetMapping("/dashboard")
    fun dashboard(model: Model): String {
        val userId = securityUtils.getCurrentUserId()
        val user = userRepository.findById(userId).orElse(null)
        val events = eventService.getEventsForUser(userId)
        val categories = categoryService.getCategoriesForUser(userId)
        val stats = eventService.getDashboardStats(userId, user?.timezone ?: "Africa/Nairobi")

        model.addAttribute("user", user)
        model.addAttribute("events", events)
        model.addAttribute("categories", categories)
        model.addAttribute("stats", stats)
        return "dashboard"
    }

    @GetMapping("/calendar")
    fun calendar(model: Model): String {
        val userId = securityUtils.getCurrentUserId()
        val user = userRepository.findById(userId).orElse(null)
        val categories = categoryService.getCategoriesForUser(userId)

        model.addAttribute("user", user)
        model.addAttribute("categories", categories)
        return "calendar"
    }

    @GetMapping("/events")
    fun events(model: Model): String {
        val userId = securityUtils.getCurrentUserId()
        val user = userRepository.findById(userId).orElse(null)
        val events = eventService.getEventsForUser(userId)
        val categories = categoryService.getCategoriesForUser(userId)

        model.addAttribute("user", user)
        model.addAttribute("events", events)
        model.addAttribute("categories", categories)
        return "events"
    }

    @GetMapping("/settings")
    fun settings(model: Model): String {
        val userId = securityUtils.getCurrentUserId()
        val user = userRepository.findById(userId).orElse(null)
        model.addAttribute("user", user)
        return "settings"
    }
}

@ControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(NoSuchElementException::class)
    fun handleNotFound(e: NoSuchElementException): ResponseEntity<Map<String, Any>> {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
            mapOf(
                "timestamp" to Instant.now(),
                "status" to 404,
                "error" to "Not Found",
                "message" to (e.message ?: "Resource not found")
            )
        )
    }

    @ExceptionHandler(IllegalArgumentException::class)
    fun handleBadRequest(e: IllegalArgumentException): ResponseEntity<Map<String, Any>> {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            mapOf(
                "timestamp" to Instant.now(),
                "status" to 400,
                "error" to "Bad Request",
                "message" to (e.message ?: "Invalid request argument")
            )
        )
    }

    @ExceptionHandler(Exception::class)
    fun handleGeneral(e: Exception): ResponseEntity<Map<String, Any>> {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
            mapOf(
                "timestamp" to Instant.now(),
                "status" to 500,
                "error" to "Internal Server Error",
                "message" to (e.message ?: "An unexpected error occurred")
            )
        )
    }
}
