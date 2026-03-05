ALTER TABLE dialysis_plans
    ADD COLUMN doctor_id VARCHAR(255),
    ADD COLUMN dialysis_type VARCHAR(80),
    ADD COLUMN sessions_per_week INTEGER,
    ADD COLUMN session_duration_minutes INTEGER,
    ADD COLUMN start_date DATE,
    ADD COLUMN end_date DATE,
    ADD COLUMN days_of_week VARCHAR(255),
    ADD COLUMN blood_flow_rate INTEGER,
    ADD COLUMN dialysate_flow_rate INTEGER,
    ADD COLUMN ultrafiltration_goal INTEGER,
    ADD COLUMN dialysis_center_id VARCHAR(255),
    ADD COLUMN room_number VARCHAR(255),
    ADD COLUMN machine_id VARCHAR(255);
