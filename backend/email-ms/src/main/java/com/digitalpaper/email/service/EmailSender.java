package com.digitalpaper.email.service;


public interface EmailSender {

    void send(String toEmail, String toName, String subject, String html);

}
