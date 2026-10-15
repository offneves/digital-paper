CREATE TABLE tb_user (
    id BIGSERIAL PRIMARY KEY,
    login VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    cpf_cnpj VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    last_login_at TIMESTAMP
);

CREATE TABLE tb_profile (
    id BIGSERIAL PRIMARY KEY,
    profile_name VARCHAR(255) NOT NULL UNIQUE,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE tb_user_profile (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    profile_id BIGINT NOT NULL,
    assigner_id BIGINT,
    status VARCHAR(255) NOT NULL,
    assigned_at TIMESTAMP NOT NULL,

    CONSTRAINT fk_user_profile_user
        FOREIGN KEY (user_id) REFERENCES tb_user (id),

    CONSTRAINT fk_user_profile_profile
        FOREIGN KEY (profile_id) REFERENCES tb_profile (id),

    CONSTRAINT fk_user_profile_assigner
        FOREIGN KEY (assigner_id) REFERENCES tb_user (id)
);
