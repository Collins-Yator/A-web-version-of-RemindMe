package com.collinsyator.remindme.security

import com.collinsyator.remindme.entity.User
import com.collinsyator.remindme.repository.UserRepository
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.security.web.SecurityFilterChain
import org.springframework.stereotype.Component
import java.time.Instant

@Configuration
@EnableWebSecurity
class SecurityConfig(
    private val customOAuth2UserService: CustomOAuth2UserService
) {
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .authorizeHttpRequests { auth ->
                auth
                    .requestMatchers("/", "/login", "/css/**", "/js/**", "/images/**", "/actuator/health").permitAll()
                    .anyRequest().authenticated()
            }
            .oauth2Login { oauth2 ->
                oauth2
                    .loginPage("/login")
                    .userInfoEndpoint { userInfo ->
                        userInfo.userService(customOAuth2UserService)
                    }
                    .defaultSuccessUrl("/dashboard", true)
            }
            .logout { logout ->
                logout
                    .logoutSuccessUrl("/")
                    .permitAll()
            }
            .csrf { csrf ->
                csrf.ignoringRequestMatchers("/api/**") // API endpoints handle tokens / sessions
            }

        return http.build()
    }
}

@Component
class CustomOAuth2UserService(
    private val userRepository: UserRepository
) : OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private val delegate = DefaultOAuth2UserService()

    override fun loadUser(userRequest: OAuth2UserRequest): OAuth2User {
        val oAuth2User = delegate.loadUser(userRequest)
        val attributes = oAuth2User.attributes

        val googleId = attributes["sub"] as? String ?: ""
        val email = attributes["email"] as? String ?: ""
        val name = attributes["name"] as? String ?: "RemindMe User"
        val picture = attributes["picture"] as? String

        val user = userRepository.findByEmail(email).orElseGet {
            User(
                id = "usr_" + googleId.takeLast(12),
                googleId = googleId,
                email = email,
                name = name,
                profileImageUrl = picture,
                timezone = "Africa/Nairobi",
                emailEnabled = true,
                webNotificationEnabled = true,
                defaultReminderMinutes = 60,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        }

        user.name = name
        user.profileImageUrl = picture
        user.updatedAt = Instant.now()
        userRepository.save(user)

        return oAuth2User
    }
}

@Component
class SecurityUtils(
    private val userRepository: UserRepository
) {
    fun getCurrentUserId(): String {
        val authentication: Authentication = SecurityContextHolder.getContext().authentication
            ?: throw IllegalStateException("No authenticated security context found")

        val principal = authentication.principal
        if (principal is OAuth2User) {
            val email = principal.attributes["email"] as? String
                ?: throw IllegalStateException("Principal email attribute not present")
            return userRepository.findByEmail(email)
                .map { it.id }
                .orElseThrow { IllegalStateException("User not registered in database: $email") }
        }

        // Fallback for development / mock test credentials
        return userRepository.findByEmail(authentication.name)
            .map { it.id }
            .orElse("user_collins_1")
    }
}
