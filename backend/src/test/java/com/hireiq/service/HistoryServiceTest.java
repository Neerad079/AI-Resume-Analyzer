package com.hireiq.service;

import com.hireiq.dto.ResumeProfileHistoryResponse;
import com.hireiq.dto.SaveToolResultRequest;
import com.hireiq.dto.SavedToolResultResponse;
import com.hireiq.model.Resume;
import com.hireiq.model.SavedToolResult;
import com.hireiq.model.User;
import com.hireiq.repository.AnalysisHistoryRepository;
import com.hireiq.repository.ResumeRepository;
import com.hireiq.repository.SavedToolResultRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class HistoryServiceTest {

    @Mock
    private AnalysisHistoryRepository historyRepository;

    @Mock
    private ResumeRepository resumeRepository;

    @Mock
    private SavedToolResultRepository savedToolResultRepository;

    @InjectMocks
    private HistoryService historyService;

    private User userA;
    private User userB;
    private Resume resume1;

    @BeforeEach
    void setUp() {
        userA = User.builder().id(1L).email("userA@hireiq.com").fullName("User A").build();
        userB = User.builder().id(2L).email("userB@hireiq.com").fullName("User B").build();

        resume1 = Resume.builder()
                .id(10L)
                .user(userA)
                .title("Software Engineer")
                .resumeText("John Doe, Experienced Java Developer with Spring Boot and React.")
                .isDefault(true)
                .build();
    }

    @Test
    void testSaveMultipleToolsUnderSameResumeProfile() {
        when(resumeRepository.findByIdAndUser(10L, userA)).thenReturn(Optional.of(resume1));
        when(savedToolResultRepository.save(any(SavedToolResult.class))).thenAnswer(invocation -> {
            SavedToolResult arg = invocation.getArgument(0);
            arg.setId(100L);
            return arg;
        });

        // 1. Save Recruiter Match
        SaveToolResultRequest matchReq = SaveToolResultRequest.builder()
                .resumeId(10L)
                .resumeText(resume1.getResumeText())
                .toolType("RECRUITER_MATCH")
                .jobTitle("Backend Engineer")
                .companyName("TechCorp")
                .score(88)
                .resultData(Map.of("matchScore", 88, "verdict", "Strong Match"))
                .build();

        SavedToolResultResponse matchRes = historyService.saveToolResult(userA, matchReq);
        assertNotNull(matchRes);
        assertEquals("RECRUITER_MATCH", matchRes.getToolType());
        assertEquals(88, matchRes.getScore());
        assertEquals(10L, matchRes.getResumeId());

        // 2. Save Diagnoser under same resume
        SaveToolResultRequest dxReq = SaveToolResultRequest.builder()
                .resumeId(10L)
                .resumeText(resume1.getResumeText())
                .toolType("DIAGNOSER")
                .score(80)
                .resultData(Map.of("atsScore", 8, "recruiterScore", 8))
                .build();

        SavedToolResultResponse dxRes = historyService.saveToolResult(userA, dxReq);
        assertNotNull(dxRes);
        assertEquals("DIAGNOSER", dxRes.getToolType());
        assertEquals(10L, dxRes.getResumeId());

        // 3. Save Polish Bullets under same resume
        SaveToolResultRequest bpReq = SaveToolResultRequest.builder()
                .resumeId(10L)
                .resumeText(resume1.getResumeText())
                .toolType("POLISH_BULLETS")
                .score(92)
                .resultData(Map.of("overallImpactScore", 92))
                .build();

        SavedToolResultResponse bpRes = historyService.saveToolResult(userA, bpReq);
        assertNotNull(bpRes);
        assertEquals("POLISH_BULLETS", bpRes.getToolType());
        assertEquals(10L, bpRes.getResumeId());

        verify(savedToolResultRepository, times(3)).save(any(SavedToolResult.class));
    }

    @Test
    void testAutoAssociateByResumeTextWhenNoIdProvided() {
        // When resumeId is null, finds existing resume with matching text
        when(resumeRepository.findByUserOrderByCreatedAtDesc(userA)).thenReturn(List.of(resume1));
        when(savedToolResultRepository.save(any(SavedToolResult.class))).thenAnswer(invocation -> {
            SavedToolResult arg = invocation.getArgument(0);
            arg.setId(200L);
            return arg;
        });

        SaveToolResultRequest req = SaveToolResultRequest.builder()
                .resumeId(null)
                .resumeText("John Doe, Experienced Java Developer with Spring Boot and React.")
                .toolType("DIAGNOSER")
                .score(85)
                .resultData(Map.of("atsScore", 9))
                .build();

        SavedToolResultResponse res = historyService.saveToolResult(userA, req);
        assertNotNull(res);
        assertEquals(10L, res.getResumeId()); // Automatically mapped to resume1
        verify(resumeRepository, never()).save(any(Resume.class)); // Did not create duplicate resume
    }

    @Test
    void testCreateNewProfileIfResumeTextNotFound() {
        when(resumeRepository.findByUserOrderByCreatedAtDesc(userA)).thenReturn(new ArrayList<>());
        when(resumeRepository.countByUser(userA)).thenReturn(0L);

        Resume newResume = Resume.builder()
                .id(99L)
                .user(userA)
                .title("Data Scientist Resume")
                .resumeText("New Resume Content")
                .isDefault(true)
                .build();

        when(resumeRepository.save(any(Resume.class))).thenReturn(newResume);
        when(savedToolResultRepository.save(any(SavedToolResult.class))).thenAnswer(invocation -> {
            SavedToolResult arg = invocation.getArgument(0);
            arg.setId(300L);
            return arg;
        });

        SaveToolResultRequest req = SaveToolResultRequest.builder()
                .resumeId(null)
                .resumeTitle("Data Scientist Resume")
                .resumeText("New Resume Content")
                .toolType("RECRUITER_MATCH")
                .score(75)
                .resultData(Map.of("matchScore", 75))
                .build();

        SavedToolResultResponse res = historyService.saveToolResult(userA, req);
        assertNotNull(res);
        assertEquals(99L, res.getResumeId());
        verify(resumeRepository, times(1)).save(any(Resume.class));
    }

    @Test
    void testUserCannotAccessOrDeleteOtherUserData() {
        SavedToolResult resultA = SavedToolResult.builder()
                .id(50L)
                .resume(resume1)
                .user(userA)
                .toolType("RECRUITER_MATCH")
                .resultData("{}")
                .build();

        // When user B attempts to find or delete result belonging to user A
        when(savedToolResultRepository.findByIdAndUser(50L, userB)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> {
            historyService.deleteSavedToolResult(50L, userB);
        });

        verify(savedToolResultRepository, never()).delete(any());
    }

    @Test
    void testGetUserResumeProfilesHistory() {
        SavedToolResult r1 = SavedToolResult.builder()
                .id(1L)
                .resume(resume1)
                .user(userA)
                .toolType("RECRUITER_MATCH")
                .score(85)
                .resultData("{\"matchScore\":85}")
                .build();

        SavedToolResult r2 = SavedToolResult.builder()
                .id(2L)
                .resume(resume1)
                .user(userA)
                .toolType("DIAGNOSER")
                .score(80)
                .resultData("{\"atsScore\":8}")
                .build();

        when(resumeRepository.findByUserOrderByCreatedAtDesc(userA)).thenReturn(List.of(resume1));
        when(savedToolResultRepository.findByResumeAndUserOrderByCreatedAtDesc(resume1, userA))
                .thenReturn(List.of(r1, r2));

        List<ResumeProfileHistoryResponse> profiles = historyService.getUserResumeProfilesHistory(userA);
        assertEquals(1, profiles.size());
        ResumeProfileHistoryResponse prof = profiles.get(0);
        assertEquals(10L, prof.getId());
        assertEquals("Software Engineer", prof.getTitle());
        assertEquals(2, prof.getSavedResultsCount());
        assertEquals("RECRUITER_MATCH", prof.getSavedResults().get(0).getToolType());
        assertEquals("DIAGNOSER", prof.getSavedResults().get(1).getToolType());
    }
}
