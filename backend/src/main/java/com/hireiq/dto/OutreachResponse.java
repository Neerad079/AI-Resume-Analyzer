package com.hireiq.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutreachResponse {

    private String linkedinDm;
    private String coldEmailSubject;
    private String coldEmailBody;
    private String coverLetterBlurb;
}
