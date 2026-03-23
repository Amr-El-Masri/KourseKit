package com.koursekit.service;

import org.springframework.stereotype.Service;
import java.security.SecureRandom;
import java.util.stream.Collectors;
import com.koursekit.repository.StudyGroupRepo;

@Service
public class InviteCodeService {

    private final StudyGroupRepo studyGroupRepo;
    private final SecureRandom random = new SecureRandom();

    public InviteCodeService(StudyGroupRepo studyGroupRepo) {
        this.studyGroupRepo = studyGroupRepo; }

        public String generateCode() {
            int length = 8;
            String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            String code;
            do {
                code = random.ints(length, 0, chars.length())
                    .mapToObj(i -> String.valueOf(chars.charAt(i)))
                    .collect(Collectors.joining()); }
            while (!isCodeUnique(code));
            return code;
    }

    public boolean isCodeUnique(String code) {
        return !(studyGroupRepo.existsByInviteCode(code)); }
}
