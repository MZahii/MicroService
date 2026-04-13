package tn.esprit.spring.clinicalservice.config;

import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.cloud.openfeign.EnableFeignClients;

import tn.esprit.spring.clinicalservice.client.AdministrationClient;
import tn.esprit.spring.clinicalservice.client.UserDirectoryClient;

@TestConfiguration
@EnableFeignClients
public class TestConfig {

    /**
     * Mock Administration Client for unit tests.
     * Prevents actual calls to administration-service during testing.
     */
    @Bean
    @Primary
    public AdministrationClient administrationClientMock() {
        return Mockito.mock(AdministrationClient.class);
    }

    /**
     * Mock User Directory Client for unit tests.
     * Prevents actual calls to user-service during testing.
     */
    @Bean
    @Primary
    public UserDirectoryClient userDirectoryClientMock() {
        return Mockito.mock(UserDirectoryClient.class);
    }
}
