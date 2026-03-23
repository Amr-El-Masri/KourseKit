package com.koursekit.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

//models imported
import com.koursekit.model.User;
import com.koursekit.model.StudyGroup;
import com.koursekit.model.StudyGroupMember;
import com.koursekit.model.GroupMessage;
import com.koursekit.model.GroupReport;
import com.koursekit.model.GroupStudySession;
import com.koursekit.model.Course;
//repos needed
import com.koursekit.repository.StudyGroupRepo;
import com.koursekit.repository.UserRepo;
import com.koursekit.repository.StudyGroupMemberRepo;
import com.koursekit.repository.GroupMessageRepo;
import com.koursekit.repository.GroupReportsRepo;
import com.koursekit.repository.GroupStudySessionRepo;
import com.koursekit.repository.CourseRepository;

@Service
public class StudyGroupService {
    private final StudyGroupRepo studyGroupRepo;
    private final StudyGroupMemberRepo studyGroupMemberRepo;
    private final InviteCodeService inviteCodeService;
    private final UserRepo userRepo;
    private final CourseRepository courseRepo;

    public StudyGroupService(StudyGroupRepo studyGroupRepo, StudyGroupMemberRepo studyGroupMemberRepo, UserRepo userRepo, InviteCodeService inviteCodeService, CourseRepository courseRepo) {
        this.studyGroupRepo = studyGroupRepo;
        this.studyGroupMemberRepo = studyGroupMemberRepo;
        this.inviteCodeService = inviteCodeService;
        this.userRepo = userRepo;
        this.courseRepo = courseRepo;
    }

    @Transactional
    public StudyGroup createGroup(Long hostId, String name, String courseCode, boolean isPrivate, Integer maxMembers) {
        User host = userRepo.findById(hostId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Course course = courseRepo.findByCourseCodeIgnoreCase(courseCode)
            .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        boolean nameTaken = studyGroupRepo.existsByNameAndCourse_Id(name, course.getId());
        if (nameTaken) {
            throw new IllegalArgumentException("Group name already exists for this course."); }

        String inviteCode = null;
        if (isPrivate) {
            inviteCode = inviteCodeService.generateCode(); }

        StudyGroup currGroup = new StudyGroup(name, course, host, isPrivate, inviteCode, maxMembers);
        StudyGroup savedGroup = studyGroupRepo.save(currGroup);
        studyGroupMemberRepo.save(new StudyGroupMember(savedGroup, host, StudyGroupMember.Role.HOST));
        return savedGroup;
    }

        public void joinPublicGroup(Long userId, Long groupId) {
            StudyGroup group = studyGroupRepo.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));

            if(group.isPrivate()) {
                throw new IllegalArgumentException("Group is private, you need an invite code from the host to enter the study group.");}
            
            User u = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

            if (studyGroupMemberRepo.existsByStudyGroup_IdAndUser_Id(groupId, userId)) {
                throw new IllegalStateException("You are already a member of this group."); }

            int currentMemberCount = studyGroupMemberRepo.countByStudyGroup_Id(groupId);
            if (group.getMaxMembers() != null && currentMemberCount >= group.getMaxMembers()) {
                throw new IllegalArgumentException("This group is full, unable to join"); }
               
            studyGroupMemberRepo.save(new StudyGroupMember(group, u, StudyGroupMember.Role.MEMBER)); 
        }

        public void joinPrivateGroup(String inviteCode, Long userID) {
             StudyGroup g = studyGroupRepo.findByInviteCode(inviteCode)
                .orElseThrow(() -> new IllegalArgumentException("Invalid invite code."));

            if (studyGroupMemberRepo.existsByStudyGroup_IdAndUser_Id(g.getId(), userID)) {
                throw new IllegalStateException("You are already a member of this group."); }

            int maxMemberCount = studyGroupMemberRepo.countByStudyGroup_Id(g.getId());
            if (g.getMaxMembers() != null && maxMemberCount >= g.getMaxMembers()) {
                throw new IllegalArgumentException("This group is full, unable to join"); }

            User u = userRepo.findById(userID)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

            studyGroupMemberRepo.save(new StudyGroupMember(g, u, StudyGroupMember.Role.MEMBER)); 
        }

        public void leaveGroup(Long userId, Long groupId) {
            if (!studyGroupMemberRepo.existsByStudyGroup_IdAndUser_Id(groupId, userId)) {
                throw new IllegalArgumentException("Membership not found"); }

            if (studyGroupMemberRepo.findByStudyGroup_IdAndUser_Id(groupId, userId).get(0).getRole() == StudyGroupMember.Role.HOST) {
                throw new IllegalStateException("Host cannot leave the group. Please assign a new host before leaving."); }
            
            studyGroupMemberRepo.deleteByStudyGroup_IdAndUser_Id(groupId, userId);
        }

        public List<StudyGroup> getGroupsForCourse(String courseCode) {
            return studyGroupRepo.findByCourse_CourseCodeAndIsPrivateFalse(courseCode); }

        public List<StudyGroup> getGroupsForUser(Long userId) {
            if (!userRepo.existsById(userId)) {
                throw new IllegalArgumentException("User not found"); }

            List<StudyGroup> groupsMemberIsIn = studyGroupMemberRepo.findByUser_Id(userId).stream()
                .map(StudyGroupMember::getStudyGroup)
                .toList();
            
            return groupsMemberIsIn;
        }

        public List<StudyGroupMember> getMembers(Long groupId) {
            return studyGroupRepo.findById(groupId)
                .map(group -> studyGroupMemberRepo.findByStudyGroup_Id(groupId))
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));
        }

        public int getMemberCount(Long groupId) {
            return studyGroupMemberRepo.countByStudyGroup_Id(groupId); }

        public Map<Long, Integer> getMemberCounts(List<Long> groupIds) {
            return studyGroupMemberRepo.countMembersByGroupIds(groupIds)
                .stream()
                .collect(Collectors.toMap(
                    row -> (Long) row[0],
                    row -> ((Long) row[1]).intValue()
                ));
}
            
    }



