package com.hireiq.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hireiq.dto.BulletRewriteRequest;
import com.hireiq.dto.BulletRewriteResponse;
import com.hireiq.service.AnalysisService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AnalysisController.class)
@AutoConfigureMockMvc(addFilters = false)
public class AnalysisControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AnalysisService analysisService;

    @MockBean
    private com.hireiq.config.JwtService jwtService;

    @MockBean
    private com.hireiq.repository.UserRepository userRepository;

    @MockBean
    private com.hireiq.config.OAuth2SuccessHandler oAuth2SuccessHandler;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void testRewriteBulletsEndpointExists() throws Exception {
        BulletRewriteRequest req = new BulletRewriteRequest();
        req.setResumeText("Engineered high-performance microservices.");

        BulletRewriteResponse res = BulletRewriteResponse.builder()
                .overallBulletGrade("S")
                .criticalSummary("Strong bullets")
                .triageResults(List.of(
                        BulletRewriteResponse.BulletAnalysis.builder()
                                .original("Engineered high-performance microservices.")
                                .rewritten("Architected microservices handling 10k QPS.")
                                .grade("S")
                                .build()
                ))
                .build();

        when(analysisService.rewriteBullets(any())).thenReturn(res);

        mockMvc.perform(post("/api/analysis/rewrite/bullets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.overallBulletGrade").value("S"))
                .andExpect(jsonPath("$.triageResults[0].grade").value("S"));
    }

    @Test
    void testLegacyRewriteEndpointDoesNotExist() throws Exception {
        // Calling removed /api/analysis/rewrite must return 404
        mockMvc.perform(post("/api/analysis/rewrite")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"resumeText\":\"sample text\"}"))
                .andExpect(status().isNotFound());
    }
}
