CREATE TABLE IF NOT EXISTS patient_dossier (
    id UUID PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    source_consultation_id UUID NOT NULL,
    source_appointment_id UUID NOT NULL,
    hospitalization_request_id UUID NOT NULL,
    primary_doctor_id UUID NOT NULL,
    assigned_nurse_id UUID,
    admission_reason TEXT NOT NULL,
    admission_priority VARCHAR(20) NOT NULL,
    status VARCHAR(24) NOT NULL,
    admitted_at TIMESTAMP NOT NULL,
    expected_discharge_at TIMESTAMP,
    discharged_at TIMESTAMP,
    discharge_summary TEXT,
    archived_to_history BOOLEAN NOT NULL DEFAULT FALSE,
    archived_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_patient_dossier_hospitalization_request
    ON patient_dossier (hospitalization_request_id);

CREATE INDEX IF NOT EXISTS idx_dossier_patient
    ON patient_dossier (patient_id);

CREATE INDEX IF NOT EXISTS idx_dossier_nurse_status
    ON patient_dossier (assigned_nurse_id, status);

CREATE INDEX IF NOT EXISTS idx_dossier_consultation
    ON patient_dossier (source_consultation_id);

CREATE INDEX IF NOT EXISTS idx_dossier_created
    ON patient_dossier (created_at DESC);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_patient_dossier_status'
    ) THEN
        ALTER TABLE patient_dossier
            ADD CONSTRAINT chk_patient_dossier_status
            CHECK (status IN ('ACTIVE', 'IN_PROGRESS', 'READY_FOR_DISCHARGE', 'DISCHARGED', 'ARCHIVED'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_patient_dossier_priority'
    ) THEN
        ALTER TABLE patient_dossier
            ADD CONSTRAINT chk_patient_dossier_priority
            CHECK (admission_priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'));
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS dossier_entry (
    id UUID PRIMARY KEY,
    dossier_id UUID NOT NULL,
    entry_type VARCHAR(24) NOT NULL,
    actor_role VARCHAR(16) NOT NULL,
    actor_id UUID NOT NULL,
    actor_display_name VARCHAR(120) NOT NULL,
    title VARCHAR(180) NOT NULL,
    details TEXT,
    medication_id UUID,
    medication_name VARCHAR(180),
    dose_value NUMERIC(10, 2),
    dose_unit VARCHAR(24),
    route VARCHAR(32),
    patient_condition VARCHAR(64),
    vitals_json TEXT,
    occurred_at TIMESTAMP NOT NULL,
    requires_signature BOOLEAN NOT NULL DEFAULT TRUE,
    signed BOOLEAN NOT NULL DEFAULT FALSE,
    signed_at TIMESTAMP,
    signature_type VARCHAR(20),
    signature_hash VARCHAR(128),
    previous_entry_id UUID,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL
);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'patient_dossier'
    )
    AND NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_dossier_entry_dossier'
    ) THEN
        ALTER TABLE dossier_entry
            ADD CONSTRAINT fk_dossier_entry_dossier
            FOREIGN KEY (dossier_id) REFERENCES patient_dossier(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_dossier_entry_type'
    ) THEN
        ALTER TABLE dossier_entry
            ADD CONSTRAINT chk_dossier_entry_type
            CHECK (entry_type IN ('MEDICATION_ADMIN', 'CONDITION_UPDATE', 'CARE_NOTE', 'TRANSFER', 'ALERT', 'DISCHARGE_NOTE'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_dossier_entry_actor_role'
    ) THEN
        ALTER TABLE dossier_entry
            ADD CONSTRAINT chk_dossier_entry_actor_role
            CHECK (actor_role IN ('NURSE', 'DOCTOR', 'SYSTEM'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_entry_dossier_occurred
    ON dossier_entry (dossier_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_entry_actor
    ON dossier_entry (actor_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_entry_unsigned
    ON dossier_entry (dossier_id, signed);
