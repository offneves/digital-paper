package com.digitalpaper.notification.messaging;

import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import com.digitalpaper.notification.client.AuthUserClient;
import com.digitalpaper.notification.config.RabbitMQConfig;
import com.digitalpaper.notification.dto.event.UserCreateEvent;
import com.digitalpaper.notification.entity.enums.NotificationType;
import com.digitalpaper.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;


@Component
@RequiredArgsConstructor
public class UserCreatedListener {

    private static final Logger log = LoggerFactory.getLogger(UserCreatedListener.class);

    private final NotificationService notificationService;
    private final AuthUserClient authUserClient;

    @RabbitListener(queues = RabbitMQConfig.QUEUE_USER_CREATED)
    public void onUserCreated(UserCreateEvent event) {
        List<Long> adminIds = authUserClient.listUserIdsByRole("ADMIN");
        if (adminIds.isEmpty()) {
            log.warn(
                "[NOTIFICATION] [USER_REGISTERED] skipped — no admin recipients "
                    + "(userId={}, login={}, role={}). Check app.internal-api-key / auth-ms.",
                event.id(),
                event.login(),
                event.role()
            );
            return;
        }

        boolean publicServant = "PUBLIC_SERVANT".equals(event.role());
        String roleLabel = roleLabel(event.role());

        String title = publicServant
            ? "Novo servidor público cadastrado"
            : "Novo usuário cadastrado";

        String body = publicServant
            ? "O servidor público %s (%s) acabou de se cadastrar."
                .formatted(event.name(), event.login())
            : "O usuário %s (%s) acabou de se cadastrar como %s."
                .formatted(event.name(), event.login(), roleLabel);

        String link = "/admin/usuarios";

        notificationService.createForUsers(
            adminIds,
            NotificationType.USER_REGISTERED,
            title,
            body,
            link,
            "auth",
            null
        );

        log.info(
            "[NOTIFICATION] [USER_REGISTERED] created for {} admin(s) "
                + "(userId={}, login={}, name={}, role={})",
            adminIds.size(),
            event.id(),
            event.login(),
            event.name(),
            event.role()
        );
    }

    private static String roleLabel(String role) {
        if (role == null || role.isBlank()) {
            return "usuário";
        }
        return switch (role) {
            case "PUBLIC_SERVANT" -> "servidor público";
            case "ENTERPRISE_USER" -> "empresa";
            case "COMMON_USER" -> "usuário público";
            case "ADMIN" -> "administrador";
            default -> role.toLowerCase();
        };
    }

}
