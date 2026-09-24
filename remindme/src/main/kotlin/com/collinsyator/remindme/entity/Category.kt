package com.collinsyator.remindme.entity

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "categories", uniqueConstraints = [
    UniqueConstraint(name = "uq_user_category", columnNames = ["user_id", "name"])
])
data class Category(
    @Id
    val id: String,

    @Column(name = "user_id")
    val userId: String?,

    @Column(nullable = false, length = 100)
    var name: String,

    @Column(nullable = false, length = 32)
    var color: String,

    @Column(name = "is_default", nullable = false)
    var isDefault: Boolean = false,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now()
)
