package tn.esprit.spring.clinicalservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@EnableDiscoveryClient
@SpringBootApplication
public class ClinicalServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(ClinicalServiceApplication.class, args);
	}

}
