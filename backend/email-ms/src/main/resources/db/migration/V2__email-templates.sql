CREATE TABLE tb_email_template (
    id BIGSERIAL PRIMARY KEY,
    template_key VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(500),
    system_template BOOLEAN NOT NULL DEFAULT FALSE,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sensitive BOOLEAN NOT NULL DEFAULT FALSE,
    subject VARCHAR(255) NOT NULL,
    preheader VARCHAR(255),
    eyebrow VARCHAR(80),
    heading VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    button_label VARCHAR(80),
    button_url VARCHAR(1000),
    notice TEXT,
    footer_note TEXT,
    variables VARCHAR(1000),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    updated_by BIGINT
);

ALTER TABLE tb_email ADD COLUMN template_key VARCHAR(64);
ALTER TABLE tb_email ADD COLUMN sensitive BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE tb_email SET
    template_key = CASE type
        WHEN 'ACCOUNT_CONFIRMATION' THEN 'account-confirmation'
        WHEN 'PASSWORD_RESET' THEN 'password-reset'
        ELSE LOWER(REPLACE(type, '_', '-'))
    END,
    sensitive = type IN ('ACCOUNT_CONFIRMATION', 'PASSWORD_RESET');

ALTER TABLE tb_email ALTER COLUMN template_key SET NOT NULL;
ALTER TABLE tb_email DROP COLUMN type;
ALTER TABLE tb_email DROP COLUMN template;

CREATE INDEX idx_email_template_key ON tb_email (template_key);
