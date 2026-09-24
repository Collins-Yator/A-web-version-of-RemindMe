package com.collinsyator.remindme

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication
@EnableScheduling
class RemindMeApplication

fun main(args: Array<String>) {
    runApplication<RemindMeApplication>(*args)
}
