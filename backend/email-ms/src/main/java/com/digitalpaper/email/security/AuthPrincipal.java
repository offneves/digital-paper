package com.digitalpaper.email.security;


public record AuthPrincipal(

    Long id,
    String login,
    String role

) {}
