package com.digitalpaper.auth.exception;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.hamcrest.Matchers;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import com.digitalpaper.auth.exception.enums.ErrorCode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;


class GlobalExceptionHandlerTests {

    @RestController
    static class TestController {

        @GetMapping("/business")
        void business() {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        @GetMapping("/unexpected")
        void unexpected() {
            throw new IllegalStateException("boom");
        }

        @GetMapping("/denied")
        void denied() {
            throw new AccessDeniedException("denied");
        }

        @PostMapping("/validated")
        void validated(@RequestBody @Valid Payload payload) {
        }

        record Payload(@NotBlank String name) {}

    }

    private final MockMvc mvc = MockMvcBuilders
        .standaloneSetup(new TestController())
        .setControllerAdvice(new GlobalExceptionHandler())
        .build();

    @Test
    void businessExceptionKeepsItsStatusAndCode() throws Exception {
        mvc.perform(get("/business"))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void unexpectedExceptionBecomesInternalError() throws Exception {
        mvc.perform(get("/unexpected"))
            .andExpect(status().isInternalServerError())
            .andExpect(jsonPath("$.code").value("INTERNAL_ERROR"))
            .andExpect(jsonPath("$.message").value(Matchers.not(Matchers.containsString("boom"))));
    }

    @Test
    void accessDeniedStaysForbidden() throws Exception {
        mvc.perform(get("/denied"))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void invalidBodyIsValidationError() throws Exception {
        mvc.perform(post("/validated").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.message").value(Matchers.startsWith("name:")));

        mvc.perform(post("/validated").contentType(MediaType.APPLICATION_JSON).content("{not json"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void springMvcErrorsKeepTheirStatus() throws Exception {
        mvc.perform(delete("/unexpected"))
            .andExpect(status().isMethodNotAllowed())
            .andExpect(jsonPath("$.code").value("METHOD_NOT_ALLOWED"));
    }

}
