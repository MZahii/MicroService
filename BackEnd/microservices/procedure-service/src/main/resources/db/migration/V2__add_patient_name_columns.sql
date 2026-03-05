ALTER TABLE dialysis_plans
    ADD COLUMN first_name VARCHAR(255),
    ADD COLUMN last_name VARCHAR(255);

ALTER TABLE surgical_cases
    ADD COLUMN first_name VARCHAR(255),
    ADD COLUMN last_name VARCHAR(255);
