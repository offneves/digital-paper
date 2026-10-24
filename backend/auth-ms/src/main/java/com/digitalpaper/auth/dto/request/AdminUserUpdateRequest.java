package com.digitalpaper.auth.dto.request;

import java.util.List;
import com.digitalpaper.auth.entity.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;


public record AdminUserUpdateRequest(

    @NotBlank(message = "Name is mandatory.")
    String name,

    @NotBlank(message = "E-mail is mandatory.")
    @Email(message = "E-mail must be valid.")
    String email,

    @NotBlank(message = "CPF/CNPJ is mandatory.")
    @Pattern(
        regexp = "^(\\d{11}|\\d{14})$",
        message = "CPF/CNPJ must contain 11 or 14 digits."
    )
    String cpfCnpj,

    @NotNull(message = "Role is mandatory.")
    UserRole role,

    @NotNull(message = "Active status is mandatory.")
    Boolean active,

    /** Quando informado, substitui os vínculos de perfil do usuário. */
    List<Long> profileIds

) {}
