package com.digitalpaper.auth.service.impl;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.digitalpaper.auth.repository.UserRepository;


@Service
public class AuthorizationService implements UserDetailsService {

    private UserRepository userRepository;

    public AuthorizationService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserDetails user = userRepository.findByLogin(username);

        if (user == null) {
            throw new UsernameNotFoundException("User not found with login: " + username);
        }

        return user;
    }

}
