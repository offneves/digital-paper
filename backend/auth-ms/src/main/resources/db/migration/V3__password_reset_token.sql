CREATE TABLE tb_password_reset_token (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,

    CONSTRAINT fk_password_reset_user
        FOREIGN KEY (user_id) REFERENCES tb_user (id)
);

CREATE INDEX idx_password_reset_token_hash ON tb_password_reset_token (token_hash);
CREATE INDEX idx_password_reset_user_id ON tb_password_reset_token (user_id);
