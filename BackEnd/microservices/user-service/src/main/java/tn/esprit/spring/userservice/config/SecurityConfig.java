package tn.esprit.spring.userservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.servlet.util.matcher.MvcRequestMatcher;
import org.springframework.web.servlet.handler.HandlerMappingIntrospector;

@Configuration
@EnableWebSecurity
@Profile("!local")
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, HandlerMappingIntrospector introspector) throws Exception {
        MvcRequestMatcher.Builder mvc = new MvcRequestMatcher.Builder(introspector);

        return http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // public endpoints
                        .requestMatchers(mvc.pattern(HttpMethod.GET, "/actuator/health")).permitAll()
                        .requestMatchers(mvc.pattern(HttpMethod.GET, "/actuator/info")).permitAll()
                        .requestMatchers(mvc.pattern("/swagger-ui/**")).permitAll()
                        .requestMatchers(mvc.pattern("/v3/api-docs/**")).permitAll()

                        // example protected endpoint
                        .requestMatchers(mvc.pattern(HttpMethod.POST, "/users/internal")).hasRole("PLATFORM_ADMIN")

                        // other endpoints require authentication (you can tighten later)
                        .requestMatchers(mvc.pattern(HttpMethod.POST, "/users/staff")).authenticated()
                        .requestMatchers(mvc.pattern(HttpMethod.POST, "/users/guardian")).authenticated()
                        .requestMatchers(mvc.pattern(HttpMethod.GET, "/users")).authenticated()

                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())))
                .build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter authorities = new JwtGrantedAuthoritiesConverter();
        authorities.setAuthorityPrefix("ROLE_");
        authorities.setAuthoritiesClaimName("realm_access.roles");

        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(authorities);
        return converter;
    }
}