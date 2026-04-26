package com.koursekit.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.Comparator;

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

    @Autowired
    private ContentFilterService contentFilterService;

    private final StudyGroupRepo studyGroupRepo;
    private final StudyGroupMemberRepo studyGroupMemberRepo;
    private final InviteCodeService inviteCodeService;
    private final UserRepo userRepo;
    private final CourseRepository courseRepo;
    private final GroupMessageRepo groupMessageRepo;
    private final GroupStudySessionRepo groupStudySessionRepo;
    private final GroupReportsRepo groupReportsRepo;

    public StudyGroupService(StudyGroupRepo studyGroupRepo, StudyGroupMemberRepo studyGroupMemberRepo, UserRepo userRepo, InviteCodeService inviteCodeService, CourseRepository courseRepo, GroupMessageRepo groupMessageRepo, GroupStudySessionRepo groupStudySessionRepo, GroupReportsRepo groupReportsRepo) {
        this.studyGroupRepo = studyGroupRepo;
        this.studyGroupMemberRepo = studyGroupMemberRepo;
        this.inviteCodeService = inviteCodeService;
        this.userRepo = userRepo;
        this.courseRepo = courseRepo;
        this.groupMessageRepo = groupMessageRepo;
        this.groupStudySessionRepo = groupStudySessionRepo;
        this.groupReportsRepo = groupReportsRepo;
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

        // Filter the group name
        ContentFilterService.FilterResult nameFilter = contentFilterService.filter(
                name, ContentFilterService.ContentContext.FORUM_GENERAL
        );
        if ("FLAGGED".equals(nameFilter.status)) {
            throw new IllegalArgumentException("Group name contains inappropriate content. Please choose a different name.");
        }

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
             StudyGroup g = studyGroupRepo.findByInviteCodeIgnoreCase(inviteCode.trim())
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

        @Transactional
        public void leaveGroup(Long userId, Long groupId) {
            if (!studyGroupMemberRepo.existsByStudyGroup_IdAndUser_Id(groupId, userId))
                throw new IllegalArgumentException("Membership not found");

            List<StudyGroupMember> allMembers = studyGroupMemberRepo.findByStudyGroup_Id(groupId);
            List<StudyGroupMember> hosts = allMembers.stream()
                .filter(m -> m.getRole() == StudyGroupMember.Role.HOST)
                .toList();
            List<StudyGroupMember> nonHosts = allMembers.stream()
                .filter(m -> m.getRole() != StudyGroupMember.Role.HOST && !m.getUser().getId().equals(userId))
                .toList();

            boolean isHost = hosts.stream().anyMatch(m -> m.getUser().getId().equals(userId));
            boolean isLastHost = isHost && hosts.size() == 1;

            if (isLastHost && allMembers.size() == 1) { //if the host is the only member and they leave,
                groupReportsRepo.deleteByStudyGroup_Id(groupId); //the group is deleted automatically
                groupMessageRepo.deleteAll_byStudyGroupID(groupId);
                groupStudySessionRepo.deleteByGroupId(groupId);
                studyGroupMemberRepo.deleteByStudyGroup_Id(groupId);
                studyGroupRepo.deleteById(groupId);
            return; }

            if (isLastHost && !nonHosts.isEmpty()) {
            // this part auto-promotes the earliest joined non-host member
            StudyGroupMember nextHost = nonHosts.stream()
                .min(Comparator.comparing(StudyGroupMember::getJoinedAt))
                .orElseThrow();
            nextHost.setRole(StudyGroupMember.Role.HOST);

            // and here it updates the group's host field too
            StudyGroup group = studyGroupRepo.findById(groupId).orElseThrow();
            group.setHost(nextHost.getUser());
            studyGroupRepo.save(group);
            studyGroupMemberRepo.save(nextHost); }

        studyGroupMemberRepo.deleteByStudyGroup_IdAndUser_Id(groupId, userId);
    }

        public List<StudyGroup> getGroupsForCourse(String courseCode) {
            return studyGroupRepo.findByCourse_CourseCodeAndIsPrivateFalse(courseCode); }

        public List<StudyGroupMember> getMembershipsForUser(Long userId) {
            if (!userRepo.existsById(userId)) {
                throw new IllegalArgumentException("User not found"); }
            return studyGroupMemberRepo.findByUser_Id(userId);
        }

        public List<StudyGroup> getGroupsForUser(Long userId) {
            return getMembershipsForUser(userId).stream()
                .map(StudyGroupMember::getStudyGroup)
                .toList();
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
                )); }

    @Transactional
    public void removeMember(Long hostId, Long groupId, Long memberId) {
        StudyGroup group = studyGroupRepo.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        if (!studyGroupMemberRepo.existsByStudyGroup_IdAndUser_IdAndRole(groupId, hostId, StudyGroupMember.Role.HOST))
            throw new IllegalStateException("Only the host can remove members");
        
        if (hostId.equals(memberId))
        throw new IllegalStateException("Host cannot remove themselves");
        
        if (!studyGroupMemberRepo.existsByStudyGroup_IdAndUser_Id(groupId, memberId))
        throw new IllegalArgumentException("Member not found");
        
        studyGroupMemberRepo.deleteByStudyGroup_IdAndUser_Id(groupId, memberId);
    }

    @Transactional
    public void assignHost(Long currentHostId, Long groupId, Long newHostId) {
        StudyGroup group = studyGroupRepo.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        if (!studyGroupMemberRepo.existsByStudyGroup_IdAndUser_IdAndRole(groupId, currentHostId, StudyGroupMember.Role.HOST))
            throw new IllegalStateException("Only the host can assign a new host");

        if (!studyGroupMemberRepo.existsByStudyGroup_IdAndUser_Id(groupId, newHostId))
            throw new IllegalArgumentException("New host must be a member of the group");

        User newHost = userRepo.findById(newHostId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        StudyGroupMember newHostMember = studyGroupMemberRepo.findByStudyGroup_IdAndUser_Id(groupId, newHostId).get(0);
        newHostMember.setRole(StudyGroupMember.Role.HOST);
        studyGroupMemberRepo.save(newHostMember);
        group.setHost(newHost);
        studyGroupRepo.save(group);
    }

    @Transactional
    public StudyGroup renameGroup(Long hostId, Long groupId, String newName) {
        StudyGroup group = studyGroupRepo.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        if (!studyGroupMemberRepo.existsByStudyGroup_IdAndUser_IdAndRole(groupId, hostId, StudyGroupMember.Role.HOST))
            throw new IllegalStateException("Only the host(s) can rename the group");

        if (newName == null || newName.isBlank())
            throw new IllegalArgumentException("The group name cannot be blank");

        group.setName(newName.trim());
        return studyGroupRepo.save(group);
    }

    @Transactional
    public void deleteGroup(Long hostId, Long groupId) {
        StudyGroup group = studyGroupRepo.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        if (!studyGroupMemberRepo.existsByStudyGroup_IdAndUser_IdAndRole(groupId, hostId, StudyGroupMember.Role.HOST))
            throw new IllegalStateException("Only the host can delete the group");

        groupReportsRepo.deleteByStudyGroup_Id(groupId);
        groupMessageRepo.deleteAll_byStudyGroupID(groupId);
        groupStudySessionRepo.deleteByGroupId(groupId);
        studyGroupMemberRepo.deleteByStudyGroup_Id(groupId);
        studyGroupRepo.deleteById(groupId);
    }  
}



