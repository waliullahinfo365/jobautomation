# Hardcoded English UI Strings - Translation Audit Report

**Generated:** May 11, 2026

This report identifies all hardcoded English UI text in the `apps/web/src` directory that should be wrapped with the `t()` internationalization function for proper translation support.

---

## Summary

- **Total Files Analyzed:** apps/web/src directory
- **Pattern Focus:** Button text, labels, headings, placeholders, status messages, empty states, and all user-facing UI strings
- **Files with Findings:** See detailed listings below

---

## Hardcoded Strings by File

### Form Inputs & Placeholders

| File | Line | Hardcoded Text | Type |
|------|------|----------------|------|
| [apps/web/src/components/profile/EditProfileModal.tsx](apps/web/src/components/profile/EditProfileModal.tsx#L74) | 74 | `"Enter your full name"` | Placeholder |
| [apps/web/src/components/profile/EditProfileModal.tsx](apps/web/src/components/profile/EditProfileModal.tsx#L80) | 80 | `"Email cannot be changed"` | Placeholder |
| [apps/web/src/components/profile/EditProfileModal.tsx](apps/web/src/components/profile/EditProfileModal.tsx#L90) | 90 | `"Enter workspace name"` | Placeholder |
| [apps/web/src/components/profile/ChangePasswordModal.tsx](apps/web/src/components/profile/ChangePasswordModal.tsx#L91) | 91 | `"Enter current password"` | Placeholder |
| [apps/web/src/components/profile/ChangePasswordModal.tsx](apps/web/src/components/profile/ChangePasswordModal.tsx#L102) | 102 | `"Enter new password (min 8 characters)"` | Placeholder |
| [apps/web/src/components/profile/ChangePasswordModal.tsx](apps/web/src/components/profile/ChangePasswordModal.tsx#L113) | 113 | `"Confirm new password"` | Placeholder |
| [apps/web/src/components/applications/ApplicationsPageClient.tsx](apps/web/src/components/applications/ApplicationsPageClient.tsx#L500) | 500 | `"Short reminder note"` | Placeholder |
| [apps/web/src/components/applications/ApplicationFilters.tsx](apps/web/src/components/applications/ApplicationFilters.tsx#L37) | 37 | `"Search by company, position, or contact email"` | Placeholder |
| [apps/web/src/components/jobs/AddJobModal.tsx](apps/web/src/components/jobs/AddJobModal.tsx#L123) | 123 | `"Acme Corp"` | Placeholder |
| [apps/web/src/components/jobs/AddJobModal.tsx](apps/web/src/components/jobs/AddJobModal.tsx#L127) | 127 | `"Senior Engineer"` | Placeholder |
| [apps/web/src/components/jobs/AddJobModal.tsx](apps/web/src/components/jobs/AddJobModal.tsx#L159) | 159 | `"Remote / City"` | Placeholder |
| [apps/web/src/components/jobs/AddJobModal.tsx](apps/web/src/components/jobs/AddJobModal.tsx#L163) | 163 | `"https://…"` | Placeholder |
| [apps/web/src/components/jobs/AddJobModal.tsx](apps/web/src/components/jobs/AddJobModal.tsx#L167) | 167 | `"$120k – $150k"` | Placeholder |
| [apps/web/src/components/jobs/AddJobModal.tsx](apps/web/src/components/jobs/AddJobModal.tsx#L179) | 179 | `"Notes, stack, team size…"` | Placeholder |
| [apps/web/src/components/applications/LogApplicationModal.tsx](apps/web/src/components/applications/LogApplicationModal.tsx#L243) | 243 | `"recruiter@company.com"` | Placeholder |
| [apps/web/src/components/applications/LogApplicationModal.tsx](apps/web/src/components/applications/LogApplicationModal.tsx#L247) | 247 | `"https://…"` | Placeholder |
| [apps/web/src/components/applications/LogApplicationModal.tsx](apps/web/src/components/applications/LogApplicationModal.tsx#L255) | 255 | `"Cover letter sent, referral name, etc."` | Placeholder |
| [apps/web/src/components/documents/UploadDocumentModal.tsx](apps/web/src/components/documents/UploadDocumentModal.tsx#L97) | 97 | `"Paste resume or cover letter text so automations can use it. Binary files alone are not parsed yet."` | Placeholder |
| [apps/web/src/components/documents/UploadDocumentModal.tsx](apps/web/src/components/documents/UploadDocumentModal.tsx#L106) | 106 | `"Optional context for this document record"` | Placeholder |
| [apps/web/src/components/reports/ReportFilters.tsx](apps/web/src/components/reports/ReportFilters.tsx#L36) | 36 | `"Search by report name"` | Placeholder |
| [apps/web/src/components/contacts/ContactFilters.tsx](apps/web/src/components/contacts/ContactFilters.tsx#L36) | 36 | `"Search name, company, role, email, or LinkedIn URL"` | Placeholder |
| [apps/web/src/components/interviews/InterviewFilters.tsx](apps/web/src/components/interviews/InterviewFilters.tsx#L36) | 36 | `"Search company, position, interviewer, or email"` | Placeholder |
| [apps/web/src/components/contacts/ImportContactsModal.tsx](apps/web/src/components/contacts/ImportContactsModal.tsx#L60) | 60 | `"Jane Doe, jane@acme.com, Acme, Recruiter\nJohn Smith, john@corp.io, Corp, Hiring Manager"` | Placeholder |
| [apps/web/src/components/settings/DeleteWorkspaceConfirmModal.tsx](apps/web/src/components/settings/DeleteWorkspaceConfirmModal.tsx#L76) | 76 | `"Type DELETE"` | Placeholder |
| [apps/web/src/components/settings/ProfileSection.tsx](apps/web/src/components/settings/ProfileSection.tsx#L44) | 44 | `"Name"` | Placeholder |
| [apps/web/src/components/settings/ProfileSection.tsx](apps/web/src/components/settings/ProfileSection.tsx#L45) | 45 | `"Email"` | Placeholder |
| [apps/web/src/components/settings/ProfileSection.tsx](apps/web/src/components/settings/ProfileSection.tsx#L49) | 49 | `"Workspace name"` | Placeholder |
| [apps/web/src/components/settings/ProfileSection.tsx](apps/web/src/components/settings/ProfileSection.tsx#L51) | 51 | `"Role"` | Placeholder |
| [apps/web/src/components/documents/DocumentFilters.tsx](apps/web/src/components/documents/DocumentFilters.tsx#L36) | 36 | `"Search by file, company, position, or type"` | Placeholder |
| [apps/web/src/components/settings/IntegrationConnectModal.tsx](apps/web/src/components/settings/IntegrationConnectModal.tsx#L218) | 218 | `"you@company.com"` | Placeholder |
| [apps/web/src/components/settings/IntegrationConnectModal.tsx](apps/web/src/components/settings/IntegrationConnectModal.tsx#L222) | 222 | `"Primary workspace"` | Placeholder |
| [apps/web/src/components/settings/IntegrationConnectModal.tsx](apps/web/src/components/settings/IntegrationConnectModal.tsx#L252) | 252 | `"sk-..."` | Placeholder |
| [apps/web/src/components/settings/IntegrationConnectModal.tsx](apps/web/src/components/settings/IntegrationConnectModal.tsx#L279) | 279 | `"smtp.gmail.com"` | Placeholder |
| [apps/web/src/components/settings/IntegrationConnectModal.tsx](apps/web/src/components/settings/IntegrationConnectModal.tsx#L285) | 285 | `"587"` | Placeholder |
| [apps/web/src/components/settings/IntegrationConnectModal.tsx](apps/web/src/components/settings/IntegrationConnectModal.tsx#L297) | 297 | `"you@company.com"` | Placeholder |
| [apps/web/src/components/settings/IntegrationConnectModal.tsx](apps/web/src/components/settings/IntegrationConnectModal.tsx#L307) | 307 | `"Leave blank to keep saved password"` | Placeholder |
| [apps/web/src/components/settings/IntegrationConnectModal.tsx](apps/web/src/components/settings/IntegrationConnectModal.tsx#L317) | 317 | `"notifications@company.com"` | Placeholder |
| [apps/web/src/components/settings/IntegrationConnectModal.tsx](apps/web/src/components/settings/IntegrationConnectModal.tsx#L327) | 327 | `"JobFlow"` | Placeholder |
| [apps/web/src/components/settings/IntegrationConnectModal.tsx](apps/web/src/components/settings/IntegrationConnectModal.tsx#L367) | 367 | `"#job-alerts"` | Placeholder |
| [apps/web/src/components/auth/RegisterForm.tsx](apps/web/src/components/auth/RegisterForm.tsx#L59) | 59 | `"Acme Job Search"` | Placeholder |
| [apps/web/src/components/auth/RegisterForm.tsx](apps/web/src/components/auth/RegisterForm.tsx#L73) | 73 | `"you@example.com"` | Placeholder |
| [apps/web/src/components/auth/RegisterForm.tsx](apps/web/src/components/auth/RegisterForm.tsx#L87) | 87 | `"At least 8 characters"` | Placeholder |
| [apps/web/src/components/auth/LoginForm.tsx](apps/web/src/components/auth/LoginForm.tsx#L53) | 53 | `"you@example.com"` | Placeholder |
| [apps/web/src/components/auth/LoginForm.tsx](apps/web/src/components/auth/LoginForm.tsx#L67) | 67 | `"••••••••"` | Placeholder |

### Section & Card Titles

| File | Line | Hardcoded Text | Type |
|------|------|----------------|------|
| [apps/web/src/components/system/SystemStatusClient.tsx](apps/web/src/components/system/SystemStatusClient.tsx#L81) | 81 | `"System Health"` | Eyebrow/Header |
| [apps/web/src/components/system/SystemStatusClient.tsx](apps/web/src/components/system/SystemStatusClient.tsx#L82) | 82 | `"System Status"` | Title |
| [apps/web/src/components/reports/ReportsOverview.tsx](apps/web/src/components/reports/ReportsOverview.tsx#L34) | 34 | `"Performance Summary"` | CardTitle |
| [apps/web/src/components/reports/DailyDigestPreview.tsx](apps/web/src/components/reports/DailyDigestPreview.tsx#L24) | 24 | `"Daily Digest Preview"` | CardTitle |
| [apps/web/src/components/reports/WeeklyReportPreview.tsx](apps/web/src/components/reports/WeeklyReportPreview.tsx#L25) | 25 | `"Weekly Performance Preview"` | CardTitle |
| [apps/web/src/components/reports/ApplicationsBySourceChart.tsx](apps/web/src/components/reports/ApplicationsBySourceChart.tsx#L29) | 29 | `"Applications by Source"` | CardTitle |
| [apps/web/src/components/reports/ApplicationsBySourceChart.tsx](apps/web/src/components/reports/ApplicationsBySourceChart.tsx#L30) | 30 | `"Which channels drive most applications."` | CardDescription |
| [apps/web/src/components/dashboard/ApplicationPipelineChart.tsx](apps/web/src/components/dashboard/ApplicationPipelineChart.tsx#L59) | 59 | `"Application Pipeline"` | Panel Title |
| [apps/web/src/components/dashboard/ApplicationPipelineChart.tsx](apps/web/src/components/dashboard/ApplicationPipelineChart.tsx#L60) | 60 | `"Distribution of jobs across each stage"` | Panel Subtitle |
| [apps/web/src/components/dashboard/UpcomingDeadlines.tsx](apps/web/src/components/dashboard/UpcomingDeadlines.tsx#L41) | 41 | `"Upcoming Deadlines"` | Panel Title |
| [apps/web/src/app/(dashboard)/profile/page.tsx](apps/web/src/app/(dashboard)/profile/page.tsx#L67) | 67 | `"Account / Profile"` | Page Title |
| [apps/web/src/app/(dashboard)/profile/page.tsx](apps/web/src/app/(dashboard)/profile/page.tsx#L71) | 71 | `"Profile details"` | SectionCard Title |
| [apps/web/src/app/(dashboard)/profile/page.tsx](apps/web/src/app/(dashboard)/profile/page.tsx#L81) | 81 | `"Connected integrations summary"` | SectionCard Title |
| [apps/web/src/components/profile/EditProfileModal.tsx](apps/web/src/components/profile/EditProfileModal.tsx#L63) | 63 | `"Edit Profile"` | Modal Title |
| [apps/web/src/components/system/SystemStatusClient.tsx](apps/web/src/components/system/SystemStatusClient.tsx#L96) | 96 | `"API health"` | CardTitle |
| [apps/web/src/components/system/SystemStatusClient.tsx](apps/web/src/components/system/SystemStatusClient.tsx#L116) | 116 | `"Protected status"` | CardTitle |
| [apps/web/src/components/system/SystemStatusClient.tsx](apps/web/src/components/system/SystemStatusClient.tsx#L219) | 219 | `"Integration health"` | CardTitle |
| [apps/web/src/components/system/SystemStatusClient.tsx](apps/web/src/components/system/SystemStatusClient.tsx#L232) | 232 | `"Recent failed automation logs"` | CardTitle |
| [apps/web/src/components/applications/ApplicationsTable.tsx](apps/web/src/components/applications/ApplicationsTable.tsx#L22) | 22 | `"Applications"` | Table Title |
| [apps/web/src/components/contacts/ContactsTable.tsx](apps/web/src/components/contacts/ContactsTable.tsx#L19) | 19 | `"Contacts"` with description `"Recruiters, referrals, hiring managers, and network threads."` | SectionCard |
| [apps/web/src/components/reports/PDFExportsTable.tsx](apps/web/src/components/reports/PDFExportsTable.tsx#L22) | 22 | `"PDF Export Tracking"` with description `"Document export queue and statuses."` | SectionCard |
| [apps/web/src/components/profile/ChangePasswordModal.tsx](apps/web/src/components/profile/ChangePasswordModal.tsx#L80) | 80 | `"Change Password"` | Modal Title |

### Data Labels & Info Row Labels

| File | Line | Hardcoded Text | Type |
|------|------|----------------|------|
| [apps/web/src/components/reports/DailyDigestPreview.tsx](apps/web/src/components/reports/DailyDigestPreview.tsx#L32-L38) | 32-38 | `"New jobs"`, `"Applications sent"`, `"Follow-ups due"`, `"Replies received"`, `"Deadlines approaching"`, `"Interviews scheduled"`, `"Failed automations"` | Metric Labels |
| [apps/web/src/components/reports/DailyDigestPreview.tsx](apps/web/src/components/reports/DailyDigestPreview.tsx#L49-L51) | 49-51 | `"Recipient Email"`, `"Last Sent Time"`, `"Next Scheduled"` | Meta Labels |
| [apps/web/src/components/reports/WeeklyReportPreview.tsx](apps/web/src/components/reports/WeeklyReportPreview.tsx#L30-L34) | 30-34 | `"Total jobs found"`, `"Applications submitted"`, `"Response rate"`, `"Interview conversion"`, `"Offers received"` | Metric Labels |
| [apps/web/src/components/reports/WeeklyReportPreview.tsx](apps/web/src/components/reports/WeeklyReportPreview.tsx#L36-L39) | 36-39 | `"Top Sources"`, `"Best Performing Categories"`, `"Bottlenecks / Recommendations"`, `"Next Week Focus"` | List Titles |
| [apps/web/src/app/(dashboard)/profile/page.tsx](apps/web/src/app/(dashboard)/profile/page.tsx#L73-L77) | 73-77 | `"User name"`, `"Email"`, `"Workspace name"`, `"Role"`, `"Account status"` | InfoRow Labels |
| [apps/web/src/components/applications/ApplicationStatsCards.tsx](apps/web/src/components/applications/ApplicationStatsCards.tsx#L38-L68) | 38-68 | `"Total Applications"`, `"Awaiting Response"`, `"Replies Received"`, `"Interviews Scheduled"`, `"Follow-ups Due"`, `"Offers"` | Stat Card Labels |
| [apps/web/src/components/applications/ApplicationDetailPanel.tsx](apps/web/src/components/applications/ApplicationDetailPanel.tsx#L70-L142) | 70-142 | `"Application Summary"`, `"Source"`, `"Date Found"`, `"Date Applied"`, `"Follow-up Date"`, `"Contact Email"`, `"Job URL"`, `"Email & Reply Status"`, `"Last Email Subject"`, `"Last Reply Snippet"`, `"Response Detected"`, `"AI Classification"`, `"Follow-up Info"`, `"Follow-up Message Preview"`, `"Reminder Status"`, `"Reminder Sent Date"`, `"Actions"`, `"Timeline"`, `"Automation Log"` | Section Titles & Info Labels |

### Table Headers & Column Names

| File | Line | Hardcoded Text | Type |
|------|------|----------------|------|
| [apps/web/src/components/documents/CoverLettersSection.tsx](apps/web/src/components/documents/CoverLettersSection.tsx#L16-L23) | 16-23 | `"Company"`, `"Position"`, `"Status"`, `"Actions"` | TableHead |
| [apps/web/src/components/documents/AllDocumentsTable.tsx](apps/web/src/components/documents/AllDocumentsTable.tsx#L26-L32) | 26-32 | `"Type"`, `"Company"`, `"Status"`, `"Actions"` | TableHead |
| [apps/web/src/components/applications/ApplicationsTable.tsx](apps/web/src/components/applications/ApplicationsTable.tsx#L29-L38) | 29-38 | `"Company"`, `"Position"`, `"Automation"`, `"Actions"` | TableHead |
| [apps/web/src/components/contacts/ContactsTable.tsx](apps/web/src/components/contacts/ContactsTable.tsx#L23-L32) | 23-32 | `"Name"`, `"Company"`, `"Role"`, `"Relationship"`, `"Email"`, `"Actions"` | TableHead |
| [apps/web/src/components/interviews/InterviewAutomationLogs.tsx](apps/web/src/components/interviews/InterviewAutomationLogs.tsx#L14-L20) | 14-20 | `"Time"`, `"Module"`, `"Status"`, `"Message"`, `"Duration"`, `"Action"` | TableHead |
| [apps/web/src/components/interviews/CompletedInterviewsSection.tsx](apps/web/src/components/interviews/CompletedInterviewsSection.tsx#L13-L20) | 13-20 | `"Company"`, `"Position"`, `"Outcome"`, `"Action"` | TableHead |
| [apps/web/src/components/interviews/PrepTasksSection.tsx](apps/web/src/components/interviews/PrepTasksSection.tsx#L20-L27) | 20-27 | `"Company"`, `"Position"`, `"Task"`, `"Priority"`, `"Status"`, `"Action"` | TableHead |
| [apps/web/src/components/reports/ReportHistoryTable.tsx](apps/web/src/components/reports/ReportHistoryTable.tsx#L38-L44) | 38-44 | `"Type"`, `"Status"`, `"Generated At"`, `"Outcome"`, `"Method"`, `"Action"` | TableHead |
| [apps/web/src/components/documents/PDFExportsSection.tsx](apps/web/src/components/documents/PDFExportsSection.tsx#L26-L27) | 26-27 | `"Export"`, `"Action"` | TableHead |
| [apps/web/src/components/reports/PDFExportsTable.tsx](apps/web/src/components/reports/PDFExportsTable.tsx#L28-L32) | 28-32 | `"Type"`, `"Export"`, `"Actions"` | TableHead |
| [apps/web/src/components/dashboard/RecentJobsTable.tsx](apps/web/src/components/dashboard/RecentJobsTable.tsx#L40-L47) | 40-47 | `"Company"`, `"Position"`, `"Source"`, `"Status"`, `"Priority"`, `"Deadline"`, `"Action"` | TableHead |
| [apps/web/src/components/documents/FolderActivityTable.tsx](apps/web/src/components/documents/FolderActivityTable.tsx#L13-L17) | 13-17 | `"Time"`, `"Job"`, `"Action"`, `"Status"` | TableHead |

### Button Text

| File | Line | Hardcoded Text | Type |
|------|------|----------------|------|
| [apps/web/src/components/documents/ResearchDocsSection.tsx](apps/web/src/components/documents/ResearchDocsSection.tsx#L25) | 25 | `"View Research"` | Button |
| [apps/web/src/components/documents/ResearchDocsSection.tsx](apps/web/src/components/documents/ResearchDocsSection.tsx#L26) | 26 | `"Update"` | Button |
| [apps/web/src/components/documents/CoverLettersSection.tsx](apps/web/src/components/documents/CoverLettersSection.tsx#L39) | 39 | `"View"` | Button |
| [apps/web/src/components/documents/CoverLettersSection.tsx](apps/web/src/components/documents/CoverLettersSection.tsx#L40) | 40 | `"Regenerate"` | Button |
| [apps/web/src/components/settings/BillingSection.tsx](apps/web/src/components/settings/BillingSection.tsx#L49) | 49 | `"Open Checkout (Pro)"` | Button |
| [apps/web/src/components/documents/CVLibrarySection.tsx](apps/web/src/components/documents/CVLibrarySection.tsx#L36) | 36 | `"View"` | Button |
| [apps/web/src/components/jobs/JobDetailHeader.tsx](apps/web/src/components/jobs/JobDetailHeader.tsx#L28-L31) | 28-31 | `"Edit Job"`, `"Generate Draft"`, `"Mark Applied"`, `"Archive"` | Buttons |
| [apps/web/src/components/reports/ReportFilters.tsx](apps/web/src/components/reports/ReportFilters.tsx#L37-L62) | 37-62 | Filter options: `"All Types"`, `"Daily Digest"`, `"Weekly Performance"`, `"PDF Export"`, `"Manual Report"`, `"All Statuses"`, `"Sent"`, `"Generated"`, `"Failed"`, `"Scheduled"`, `"All Dates"` | Select Options |
| [apps/web/src/components/interviews/AwaitingConfirmationSection.tsx](apps/web/src/components/interviews/AwaitingConfirmationSection.tsx#L24-L26) | 24-26 | `"Confirm"`, `"Suggest New Time"`, `"Ignore"` | Buttons |
| [apps/web/src/components/interviews/InterviewCard.tsx](apps/web/src/components/interviews/InterviewCard.tsx#L55-L58) | 55-58 | `"View"`, `"Mark Complete"`, `"Reschedule"` | Buttons |
| [apps/web/src/components/interviews/CompletedInterviewsSection.tsx](apps/web/src/components/interviews/CompletedInterviewsSection.tsx#L33) | 33 | `"View Notes"` | Button |
| [apps/web/src/components/interviews/PrepTasksSection.tsx](apps/web/src/components/interviews/PrepTasksSection.tsx#L41) | 41 | `"Mark Done"` | Button |
| [apps/web/src/components/contacts/FollowUpsDueSection.tsx](apps/web/src/components/contacts/FollowUpsDueSection.tsx#L39-L40) | 39-40 | `"Snooze"`, `"Open Email"` | Buttons |
| [apps/web/src/components/contacts/ContactsTable.tsx](apps/web/src/components/contacts/ContactsTable.tsx#L49-L51) | 49-51 | `"View"`, `"Open LinkedIn"` | Buttons |
| [apps/web/src/components/documents/AllDocumentsTable.tsx](apps/web/src/components/documents/AllDocumentsTable.tsx#L51-L67) | 51-67 | `"View"` (in loop with different actions) | Buttons |
| [apps/web/src/components/jobs/JobDetailHeader.tsx](apps/web/src/components/jobs/JobDetailHeader.tsx#L28-L31) | 28-31 | `"Edit Job"`, `"Generate Draft"`, `"Mark Applied"`, `"Archive"` | Buttons |

### Panel & Section Titles

| File | Line | Hardcoded Text | Type |
|------|------|----------------|------|
| [apps/web/src/components/contacts/ContactDetailPanel.tsx](apps/web/src/components/contacts/ContactDetailPanel.tsx#L57-L91) | 57-91 | `"Contact Information"`, `"Email"`, `"Phone"`, `"LinkedIn URL"`, `"Location"`, `"Source"`, `"Last Contacted"`, `"Next Follow-up"`, `"Related Jobs"`, `"Communication History"`, `"Follow-Up Plan"`, `"Notes"`, `"Automation Activity"` | SectionCard Titles |
| [apps/web/src/components/jobs/JobOverviewCard.tsx](apps/web/src/components/jobs/JobOverviewCard.tsx#L13-L50) | 13-50 | `"Job Overview"`, `"Company"`, `"Position"`, `"Location"`, `"Source"`, `"Job URL"`, `"Salary Range"`, `"Deadline"`, `"Date Found"`, `"Date Applied"`, `"Contact Email"`, `"Open Drive Job Folder"`, `"Open Research Folder"`, `"Open Cover Letter Folder"`, `"Open AI Draft Google Doc"` | Overview Items |
| [apps/web/src/components/jobs/JobDocumentsCard.tsx](apps/web/src/components/jobs/JobDocumentsCard.tsx#L28) | 28 | `"Documents"` | SectionCard Title |
| [apps/web/src/components/interviews/UpcomingInterviewsSection.tsx](apps/web/src/components/interviews/UpcomingInterviewsSection.tsx#L16) | 16 | `"Upcoming Interviews"` | SectionCard Title |
| [apps/web/src/components/interviews/CalendarWeekView.tsx](apps/web/src/components/interviews/CalendarWeekView.tsx#L20) | 20 | `"Calendar View"` with description `"Mock weekly calendar grouped by day."` | SectionCard |
| [apps/web/src/components/documents/DocumentList.tsx](apps/web/src/components/documents/DocumentList.tsx#L13) | 13 | `"Document List"` | SectionCard Title |
| [apps/web/src/components/interviews/CompletedInterviewsSection.tsx](apps/web/src/components/interviews/CompletedInterviewsSection.tsx#L9) | 9 | `"Completed Interviews"` with description `"Track outcomes and follow-up status."` | SectionCard |
| [apps/web/src/components/interviews/PrepTasksSection.tsx](apps/web/src/components/interviews/PrepTasksSection.tsx#L16) | 16 | `"Prep Tasks"` with description `"Prioritized prep checklist for upcoming rounds."` | SectionCard |
| [apps/web/src/components/documents/PDFExportsSection.tsx](apps/web/src/components/documents/PDFExportsSection.tsx#L17) | 17 | `"PDF Exports"` with description `"PDF generation and export queue status."` | SectionCard |
| [apps/web/src/components/documents/FolderAutomationSection.tsx](apps/web/src/components/documents/FolderAutomationSection.tsx#L35-L41) | 35-41 | `"Auto-create folder on new job"`, `"Move CV on ready-to-apply"`, `"Export final documents as PDF"` | Row Labels |
| [apps/web/src/components/documents/AllDocumentsTable.tsx](apps/web/src/components/documents/AllDocumentsTable.tsx#L21) | 21 | `"All Documents"` with description `"All document assets across jobs and automations."` | SectionCard |
| [apps/web/src/components/documents/ResearchDocsSection.tsx](apps/web/src/components/documents/ResearchDocsSection.tsx#L10) | 10 | `"Research Documents"` with description `"AI-generated and manually refined research notes."` | SectionCard |
| [apps/web/src/components/interviews/InterviewAutomationLogs.tsx](apps/web/src/components/interviews/InterviewAutomationLogs.tsx#L10) | 10 | `"Automation Logs"` with description `"Scheduling and reminder activity logs."` | SectionCard |
| [apps/web/src/components/documents/CVLibrarySection.tsx](apps/web/src/components/documents/CVLibrarySection.tsx#L17) | 17 | `"CV Library"` with description `"Role-specific CV versions and default routing preference."` | SectionCard |
| [apps/web/src/components/automation/AutomationDetailPanel.tsx](apps/web/src/components/automation/AutomationDetailPanel.tsx#L61-L109) | 61-109 | `"Trigger Info"`, `"Trigger Type"`, `"Trigger Source"`, `"Schedule"`, `"Input Source"`, `"Connected Account"`, `"Environment"`, `"Retry Policy"`, `"Error Handling"` | SectionCard & Info Labels |

### Dialog & Modal Content

| File | Line | Hardcoded Text | Type |
|------|------|----------------|------|
| [apps/web/src/components/documents/UploadDocumentModal.tsx](apps/web/src/components/documents/UploadDocumentModal.tsx#L51) | 51 | `"Select a file first."` | Error Message |
| [apps/web/src/components/settings/DeleteWorkspaceConfirmModal.tsx](apps/web/src/components/settings/DeleteWorkspaceConfirmModal.tsx#L55) | 55 | `"Delete Workspace"` | Modal Title |
| [apps/web/src/components/automation/AutomationLogDetailModal.tsx](apps/web/src/components/automation/AutomationLogDetailModal.tsx#L41-L59) | 41-59 | `"Module"`, `"Message"`, `"Error"`, `"Error details"`, `"Duration"` | Modal Content Labels |

### Empty State Messages

| File | Line | Hardcoded Text | Type |
|------|------|----------------|------|
| [apps/web/src/components/applications/ApplicationsPageClient.tsx](apps/web/src/components/applications/ApplicationsPageClient.tsx#L427-L434) | 427-434 | `"No applications yet"`, `"No matching applications"`, `"Clear filters"` | Empty State |
| [apps/web/src/components/contacts/ContactsPageClient.tsx](apps/web/src/components/contacts/ContactsPageClient.tsx#L307) | 307 | `"Loading contacts..."` with description `"Fetching your network from the backend."` | LoadingState |
| [apps/web/src/components/contacts/ContactsPageClient.tsx](apps/web/src/components/contacts/ContactsPageClient.tsx#L349-L358) | 349-358 | `"No contacts yet"`, `"Add contact"`, `"No matching contacts"`, `"Clear filters"` | Empty States |
| [apps/web/src/components/reports/ReportsPageClient.tsx](apps/web/src/components/reports/ReportsPageClient.tsx#L559-L575) | 559-575 | `"Loading reports"`, `"Fetching report history and analytics…"`, `"Reports unavailable"`, `"Retry"` | Loading/Error States |
| [apps/web/src/components/reports/ReportsPageClient.tsx](apps/web/src/components/reports/ReportsPageClient.tsx#L645-L675) | 645-675 | `"No PDF exports yet"`, `"No report history yet"`, `"No matching reports"`, `"Clear filters"` | Empty States |
| [apps/web/src/components/interviews/InterviewsPageClient.tsx](apps/web/src/components/interviews/InterviewsPageClient.tsx#L327-L332) | 327-332 | `"No interviews scheduled"` with description `"Schedule an interview or connect your calendar when OAuth is ready."`, `"No matching interviews"`, `"Clear filters"` | Empty States |
| [apps/web/src/components/interviews/InterviewsPageClient.tsx](apps/web/src/components/interviews/InterviewsPageClient.tsx#L361) | 361 | `"Nothing awaiting confirmation"` with description `"Scheduling threads will appear here."` | EmptyState |
| [apps/web/src/components/documents/DocumentsPageClient.tsx](apps/web/src/components/documents/DocumentsPageClient.tsx#L385) | 385 | `"Loading documents..."` with description `"Fetching document library from the backend."` | LoadingState |
| [apps/web/src/components/documents/DocumentsPageClient.tsx](apps/web/src/components/documents/DocumentsPageClient.tsx#L422-L427) | 422-427 | `"No documents"` with description `"Documents from the API will appear here."`, `"No matching documents"`, `"Clear filters"` | Empty States |

### Status Labels & Badges

| File | Line | Hardcoded Text | Type |
|------|------|----------------|------|
| [apps/web/src/components/documents/CVLibrarySection.tsx](apps/web/src/components/documents/CVLibrarySection.tsx#L27) | 27 | `"Default"` | Badge |
| [apps/web/src/components/documents/PDFExportsSection.tsx](apps/web/src/components/documents/PDFExportsSection.tsx#L62) | 62 | `"Pending"` | Status Text |
| [apps/web/src/components/reports/PDFExportsTable.tsx](apps/web/src/components/reports/PDFExportsTable.tsx#L73-L85) | 73-85 | `"Pending"` | Status Text |
| [apps/web/src/components/system/SystemStatusClient.tsx](apps/web/src/components/system/SystemStatusClient.tsx#L104-L153) | 104-153 | `"Status"`, `"Database"`, `"Queue mode"`, `"Tenant"`, `"Role"`, `"Automation modules"`, `"Plan"` | Data Labels |

### Toast & Notification Messages

| File | Line | Hardcoded Text | Type |
|------|------|----------------|------|
| [apps/web/src/components/documents/UploadDocumentModal.tsx](apps/web/src/components/documents/UploadDocumentModal.tsx#L51) | 51 | `"Select a file first."` | Error Toast |
| [apps/web/src/components/reports/ReportsPageClient.tsx](apps/web/src/components/reports/ReportsPageClient.tsx#L126) | 126 | `"Report generation started. It will appear in history after the worker finishes."` | Info Toast |
| [apps/web/src/components/reports/ReportsPageClient.tsx](apps/web/src/components/reports/ReportsPageClient.tsx#L130) | 130 | `"Report generated successfully. Report ID: ${reportId}"` | Success Toast |
| [apps/web/src/components/reports/ReportsPageClient.tsx](apps/web/src/components/reports/ReportsPageClient.tsx#L288-L553) | 288-553 | Multiple toast messages: `"Could not refresh reports."`, `"Could not queue report generation."`, `"No notification provider configured. Report preview saved only."`, `"Delivery completed with warnings; open the report for channel details."`, `"Report test delivery completed."`, `"Send test failed."`, etc. | Toast Messages |
| [apps/web/src/components/interviews/InterviewsPageClient.tsx](apps/web/src/components/interviews/InterviewsPageClient.tsx#L303) | 303 | `"Calendar sync will be available after Google OAuth is connected."` | Info Toast |

### Sidebar & Navigation

| File | Line | Hardcoded Text | Type |
|------|------|----------------|------|
| [apps/web/src/components/layout/MobileNav.tsx](apps/web/src/components/layout/MobileNav.tsx#L49) | 49 | Uses `t("common.close")` (correctly translated) but review for other hardcoded labels | Navigation |
| [apps/web/src/components/layout/Topbar.tsx](apps/web/src/components/layout/Topbar.tsx#L100) | 100 | `"You"` | Avatar Label |

### Settings Section Content

| File | Line | Hardcoded Text | Type |
|------|------|----------------|------|
| [apps/web/src/components/settings/SecuritySection.tsx](apps/web/src/components/settings/SecuritySection.tsx#L14-L20) | 14-20 | `"Security"` title with description `"Security controls are placeholders in this UI phase."`, Labels: `"Password"`, `"Two-factor authentication"`, `"Active sessions"`, `"API keys"`, `"Audit logs"` | SettingSectionCard & Fields |
| [apps/web/src/components/settings/NotificationsSection.tsx](apps/web/src/components/settings/NotificationsSection.tsx#L14-L20) | 14-20 | `"Notification Channels"`, Channel names: `"Email"`, `"Dashboard"`, `"Slack (placeholder)"`, `"Event Preferences"` | SettingSectionCard & ChannelRows |
| [apps/web/src/components/settings/BillingSection.tsx](apps/web/src/components/settings/BillingSection.tsx#L20-L43) | 20-43 | `"Loading billing"`, `"Fetching plan and usage..."`, `"Billing unavailable"`, `"Retry"`, `"Billing"` description `"Stubbed SaaS billing integration preview for API connectivity."`, Labels: `"Current Plan"`, `"Jobs"`, `"Automation Runs"`, `"AI Credits"`, `"Storage Usage"` | Loading/Error States & Field Labels |

### Integration Settings

| File | Line | Hardcoded Text | Type |
|------|------|----------------|------|
| [apps/web/src/components/settings/IntegrationCard.tsx](apps/web/src/components/settings/IntegrationCard.tsx#L107-L155) | 107-155 | `"Required for"`, `"Connected account"`, `"Last sync"`, `"Sync status"`, `"Status"` with value `"Demo / Not Live - reconnect with Google OAuth."`, `"Error"`, `"Reconnect required"`, `"Google Docs"` description, `"Scopes"`, `"Model"`, `"API key"`, `"Connection type"` with value `"Incoming Webhook"`, `"Channel"` with default value `"#job-alerts"`, `"SMTP host"`, `"Port"`, `"From email"`, `"App password"` with value `"Saved securely"`, `"API key configured"` | Integration Field Labels |

### Auth Forms

| File | Line | Hardcoded Text | Type |
|------|------|----------------|------|
| [apps/web/src/components/auth/AuthGuard.tsx](apps/web/src/components/auth/AuthGuard.tsx#L44) | 44 | `"Checking your session..."` with description `"Verifying account access for this workspace."` | LoadingState |

### Contact Actions

| File | Line | Hardcoded Text | Type |
|------|------|----------------|------|
| [apps/web/src/components/contacts/ContactsPageClient.tsx](apps/web/src/components/contacts/ContactsPageClient.tsx#L399) | 399 | `"Add contact"` | Modal Title |

### Dashboard Content

| File | Line | Hardcoded Text | Type |
|------|------|----------------|------|
| [apps/web/src/components/dashboard/ApplicationPipelineChart.tsx](apps/web/src/components/dashboard/ApplicationPipelineChart.tsx#L162-L176) | 162-176 | `"Conversion"`, `"applied → interview"`, `"Avg. velocity"`, `"stage to stage"`, `"Synced"` | Stat Labels |
| [apps/web/src/components/reports/DailyDigestCard.tsx](apps/web/src/components/reports/DailyDigestCard.tsx#L28) | 28 | `"Automation Errors"` | Metric Label |
| [apps/web/src/components/reports/WeeklyApplicationTrendChart.tsx](apps/web/src/components/reports/WeeklyApplicationTrendChart.tsx#L29-L30) | 29-30 | `"Weekly Application Trend"`, `"Applications submitted by day in current week."` | Chart Title & Description |

### Interview Content

| File | Line | Hardcoded Text | Type |
|------|------|----------------|------|
| [apps/web/src/components/interviews/InterviewDetailPanel.tsx](apps/web/src/components/interviews/InterviewDetailPanel.tsx#L57-L105) | 57-105 | `"Interview Details"`, `"Date/time"`, `"Duration"` with format `"${interview.durationMinutes} minutes"`, `"Interviewer"` with format `"${interview.interviewerName} (${interview.interviewerRole})"`, `"Contact email"`, `"Meeting link"`, `"Location"`, `"Calendar event ID"`, `"Related job/application"`, `"Actions"`, `"Prep Checklist"`, `"Notes"`, `"Timeline"` | SectionCard Titles & Info Labels |
| [apps/web/src/components/interviews/InterviewDetailPanel.tsx](apps/web/src/components/interviews/InterviewDetailPanel.tsx#L85) | 85 | `"Mark Complete"` | Button |
| [apps/web/src/components/interviews/CalendarSyncStatusCard.tsx](apps/web/src/components/interviews/CalendarSyncStatusCard.tsx#L15-L17) | 15-17 | `"Connect Calendar"` | Button |

### Miscellaneous UI Strings

| File | Line | Hardcoded Text | Type |
|------|------|----------------|------|
| [apps/web/src/components/jobs/JobAutomationActivity.tsx](apps/web/src/components/jobs/JobAutomationActivity.tsx#L50) | 50 | `"Automation Activity"` | SectionCard Title |
| [apps/web/src/components/documents/DocumentsPageClient.tsx](apps/web/src/components/documents/DocumentsPageClient.tsx#L377-L398) | 377-398 | `"Documents"` page title | PageTitle |
| [apps/web/src/components/interviews/InterviewsPageClient.tsx](apps/web/src/components/interviews/InterviewsPageClient.tsx#L270-L310) | 270-310 | `"Interviews"` page title with various section headers and filter options | Page Content |
| [apps/web/src/components/automation/AutomationDetailPanel.tsx](apps/web/src/components/automation/AutomationDetailPanel.tsx#L61-L109) | 61-109 | Automation panel titles and labels | Panel Content |

---

## Recommendations

1. **Wrap all identified strings** with the `t()` translation function
2. **Create translation keys** following a consistent naming convention (e.g., `common.save`, `form.placeholder.email`, `table.header.company`)
3. **Extract strings progressively** starting with the most critical user-facing text (buttons, labels, status messages)
4. **Test translations** thoroughly after implementation
5. **Consider using i18n-ally or similar** VS Code extension to help identify and manage untranslated strings
6. **Review and update status messages** in toast notifications to ensure consistency

---

## Files with Most Hardcoded Strings (Priority Order)

1. `apps/web/src/components/reports/ReportsPageClient.tsx` - Multiple toast messages and content
2. `apps/web/src/components/settings/IntegrationCard.tsx` - Many integration-specific labels
3. `apps/web/src/components/system/SystemStatusClient.tsx` - System info labels
4. `apps/web/src/components/interviews/InterviewDetailPanel.tsx` - Interview details labels
5. `apps/web/src/components/applications/ApplicationDetailPanel.tsx` - Application details labels
6. `apps/web/src/components/settings/IntegrationConnectModal.tsx` - Integration setup form labels

