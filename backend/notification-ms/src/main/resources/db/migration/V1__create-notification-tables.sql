CREATE TABLE tb_announcement (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(64) NOT NULL,
    audience VARCHAR(64) NOT NULL,
    audience_ref VARCHAR(255),
    link VARCHAR(512),
    created_by BIGINT NOT NULL,
    published_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);

CREATE TABLE tb_notification (
    id BIGSERIAL PRIMARY KEY,
    recipient_user_id BIGINT NOT NULL,
    announcement_id BIGINT,
    type VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    link VARCHAR(512),
    source VARCHAR(64) NOT NULL,
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,

    CONSTRAINT fk_notification_announcement
        FOREIGN KEY (announcement_id) REFERENCES tb_announcement (id)
);

CREATE INDEX idx_notification_recipient_created
    ON tb_notification (recipient_user_id, created_at DESC);

CREATE INDEX idx_notification_recipient_unread
    ON tb_notification (recipient_user_id)
    WHERE read_at IS NULL;

CREATE INDEX idx_notification_announcement
    ON tb_notification (announcement_id);
