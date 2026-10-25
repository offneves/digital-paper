package com.digitalpaper.email.composer;


public interface EmailComposer<E> {

    EmailMessage compose(E event);

}
