package com.digitalpaper.notification.security;


public record AuthPrincipal(

    Long id,
    String login,
    String role

) {}
