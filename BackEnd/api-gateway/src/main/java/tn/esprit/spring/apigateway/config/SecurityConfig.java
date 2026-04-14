package tn.esprit.spring.apigateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.disable())
                .authorizeExchange(exchange -> exchange
                        // Allow diagnostic endpoints
                        .pathMatchers("/api/diagnostic/**").permitAll()
                        // Allow pharmacy endpoints without authentication
                        .pathMatchers(HttpMethod.GET, "/api/pharmacy/**").permitAll()
                        .pathMatchers(HttpMethod.POST, "/api/pharmacy/**").permitAll()
                        .pathMatchers(HttpMethod.PUT, "/api/pharmacy/**").permitAll()
                        .pathMatchers(HttpMethod.DELETE, "/api/pharmacy/**").permitAll()
                        .pathMatchers(HttpMethod.PATCH, "/api/pharmacy/**").permitAll()
                        // Allow auth endpoints
                        .pathMatchers("/api/auth/**").permitAll()
                        // Protect all other endpoints with OAuth2
                        .anyExchange().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwtConfigurer -> {}));
        return http.build();
    }
}
