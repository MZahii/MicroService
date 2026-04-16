CREATE TABLE IF NOT EXISTS dossier_contributor (
    id UUID PRIMARY KEY,
    dossier_id UUID NOT NULL,
    contributor_id UUID NOT NULL,
    contributor_role VARCHAR(16) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    added_at TIMESTAMP NOT NULL,
    removed_at TIMESTAMP,
    added_by UUID NOT NULL,
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
        WHERE conname = 'fk_dossier_contributor_dossier'
    ) THEN
        ALTER TABLE dossier_contributor
            ADD CONSTRAINT fk_dossier_contributor_dossier
            FOREIGN KEY (dossier_id) REFERENCES patient_dossier(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_dossier_contributor_role'
    ) THEN
        ALTER TABLE dossier_contributor
            ADD CONSTRAINT chk_dossier_contributor_role
            CHECK (contributor_role IN ('DOCTOR', 'NURSE'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_dossier_contributor_removed_after_added'
    ) THEN
        ALTER TABLE dossier_contributor
            ADD CONSTRAINT chk_dossier_contributor_removed_after_added
            CHECK (removed_at IS NULL OR removed_at >= added_at);
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uk_dossier_contributor_active
    ON dossier_contributor (dossier_id, contributor_id, contributor_role, active);

CREATE INDEX IF NOT EXISTS idx_contributor_dossier
    ON dossier_contributor (dossier_id, active);

CREATE INDEX IF NOT EXISTS idx_contributor_user
    ON dossier_contributor (contributor_id, active);
