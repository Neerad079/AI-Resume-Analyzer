package com.hireiq.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hireiq.dto.ResumeProfileHistoryResponse;
import com.hireiq.dto.SaveToolResultRequest;
import com.hireiq.dto.SavedToolResultResponse;
import com.hireiq.model.User;
import com.hireiq.service.HistoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = HistoryController.class)
@AutoConfigureMockMvc(addFilters = false) // focus on controller endpoints
public class HistoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private HistoryService historyService;

    @MockBean
    private com.hireiq.config.JwtService jwtService;

    @MockBean
    private com.hireiq.repository.UserRepository userRepository;

    @MockBean
    private com.hireiq.config.OAuth2SuccessHandler oAuth2SuccessHandler;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder().id(1L).email("test@hireiq.com").fullName("Test User").build();
    }

    @Test
    void testGetProfilesHistory() throws Exception {
        ResumeProfileHistoryResponse profile = ResumeProfileHistoryResponse.builder()
                .id(10L)
                .title("Software Engineer")
                .savedResultsCount(2)
                .isDefault(true)
                .build();

        when(historyService.getUserResumeProfilesHistory(any())).thenReturn(List.of(profile));

        mockMvc.perform(get("/api/history/profiles")
                        .with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[0].title").value("Software Engineer"))
                .andExpect(jsonPath("$[0].savedResultsCount").value(2))
                .andExpect(jsonPath("$[0].isDefault").value(true))
                .andExpect(jsonPath("$[0].default").doesNotExist());
    }

    @Test
    void testSaveToolResult() throws Exception {
        SaveToolResultRequest req = SaveToolResultRequest.builder()
                .resumeId(10L)
                .resumeText("Resume text content")
                .toolType("RECRUITER_MATCH")
                .score(85)
                .resultData(Map.of("matchScore", 85))
                .build();

        SavedToolResultResponse res = SavedToolResultResponse.builder()
                .id(100L)
                .resumeId(10L)
                .toolType("RECRUITER_MATCH")
                .score(85)
                .createdAt(LocalDateTime.now())
                .build();

        when(historyService.saveToolResult(any(), any())).thenReturn(res);

        mockMvc.perform(post("/api/history/save")
                        .with(user(testUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(100))
                .andExpect(jsonPath("$.toolType").value("RECRUITER_MATCH"))
                .andExpect(jsonPath("$.resumeId").value(10));
    }

    @Test
    void testDeleteSavedToolResult() throws Exception {
        mockMvc.perform(delete("/api/history/results/100")
                        .with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Tool result deleted successfully"));
    }

    @Test
    void testDeleteResumeProfile() throws Exception {
        mockMvc.perform(delete("/api/history/profiles/10")
                        .with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Resume profile and all associated results deleted"));
    }

    @Test
    void testResumeDtoSerialization() throws Exception {
        com.hireiq.dto.ResumeResponse resumeResponse = com.hireiq.dto.ResumeResponse.builder()
                .id(1L)
                .title("Test Resume")
                .isDefault(true)
                .build();
        String json = objectMapper.writeValueAsString(resumeResponse);
        com.fasterxml.jackson.databind.JsonNode node = objectMapper.readTree(json);
        org.junit.jupiter.api.Assertions.assertTrue(node.has("isDefault"));
        org.junit.jupiter.api.Assertions.assertFalse(node.has("default"));
        org.junit.jupiter.api.Assertions.assertTrue(node.get("isDefault").asBoolean());

        ResumeProfileHistoryResponse profile = ResumeProfileHistoryResponse.builder()
                .id(1L)
                .title("Test Profile")
                .isDefault(true)
                .build();
        String profileJson = objectMapper.writeValueAsString(profile);
        com.fasterxml.jackson.databind.JsonNode profileNode = objectMapper.readTree(profileJson);
        org.junit.jupiter.api.Assertions.assertTrue(profileNode.has("isDefault"));
        org.junit.jupiter.api.Assertions.assertFalse(profileNode.has("default"));
        org.junit.jupiter.api.Assertions.assertTrue(profileNode.get("isDefault").asBoolean());
    }
}
