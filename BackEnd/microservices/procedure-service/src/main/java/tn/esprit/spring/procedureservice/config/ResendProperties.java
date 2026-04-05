package tn.esprit.spring.procedureservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "resend")
public class ResendProperties {
    private boolean enabled;
    private String apiKey;
    private String fromEmail;
    private String demoRecipient;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getFromEmail() {
        return fromEmail;
    }

    public void setFromEmail(String fromEmail) {
        this.fromEmail = fromEmail;
    }

    public String getDemoRecipient() {
        return demoRecipient;
    }

    public void setDemoRecipient(String demoRecipient) {
        this.demoRecipient = demoRecipient;
    }
}
