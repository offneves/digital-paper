CREATE TABLE tb_email (
    id BIGSERIAL PRIMARY KEY,
    event_id VARCHAR(64) UNIQUE,
    type VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    source VARCHAR(64) NOT NULL,
    recipient_user_id BIGINT,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject VARCHAR(255) NOT NULL,
    template VARCHAR(128) NOT NULL,
    body TEXT,
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL,
    last_error TEXT,
    next_attempt_at TIMESTAMP,
    sent_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);

CREATE TABLE tb_email_attempt (
    id BIGSERIAL PRIMARY KEY,
    email_id BIGINT NOT NULL,
    attempt_number INT NOT NULL,
    success BOOLEAN NOT NULL,
    error TEXT,
    duration_ms BIGINT NOT NULL,
    attempted_at TIMESTAMP NOT NULL,

    CONSTRAINT fk_email_attempt_email
        FOREIGN KEY (email_id) REFERENCES tb_email (id) ON DELETE CASCADE
);

CREATE INDEX idx_email_status_next_attempt
    ON tb_email (status, next_attempt_at)
    WHERE status = 'RETRYING';

CREATE INDEX idx_email_created_at ON tb_email (created_at DESC);
CREATE INDEX idx_email_recipient_email ON tb_email (LOWER(recipient_email));
CREATE INDEX idx_email_recipient_user ON tb_email (recipient_user_id);
CREATE INDEX idx_email_attempt_email ON tb_email_attempt (email_id);
