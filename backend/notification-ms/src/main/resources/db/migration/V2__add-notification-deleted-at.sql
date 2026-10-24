ALTER TABLE tb_notification
    ADD COLUMN deleted_at TIMESTAMP;

CREATE INDEX idx_notification_recipient_deleted
    ON tb_notification (recipient_user_id, deleted_at);
