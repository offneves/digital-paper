ALTER TABLE tb_user ADD COLUMN email_verified_at TIMESTAMP;

UPDATE tb_user SET email_verified_at = COALESCE(updated_at, created_at);

CREATE TABLE tb_email_verification_token (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,

    CONSTRAINT fk_email_verification_user
        FOREIGN KEY (user_id) REFERENCES tb_user (id)
);

CREATE INDEX idx_email_verification_user_id ON tb_email_verification_token (user_id);
