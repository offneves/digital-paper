package com.digitalpaper.auth_ms.service;

import com.digitalpaper.auth_ms.dto.request.RegisterRequest;


public interface UserService {

    void userRegistry(RegisterRequest registerRequest);

}
