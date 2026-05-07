// Implementation matrix aligned to Make.com blueprints.
// status: fully-working | partially-working | stub-demo-only | missing
// native trigger: queue/api/scheduler event now used in codebase.

/*
scenario | old Make trigger | native trigger | status | missing work
01 Job Intake Engine | Gmail new job-alert email | scheduler -> job-intake worker | partially-working | tune Gmail history cursor persistence and richer parser tuning
02 Duplicate Protection Engine | on intake create/update | duplicate-protection worker on new jobs | fully-working | add more similarity signals/tests
03 Folder & Subfolder Automation | job created/stage change | folder-automation worker | partially-working | idempotent re-use of root/app folders + subfolder tree creation (CV/Cover/Research/Exports)
04 Applied Status Automation | application moved to Applied | applied-status worker | stub-demo-only | full state transitions + side effects
05 Interview Scheduling Automation | interview stage transitions | interview-scheduling worker + API queue | partially-working | map additional interview types and deterministic duplicate lookup across date windows
06 CV File Routing Automation | CV uploaded / folder ready | cv-routing worker | stub-demo-only | copy/move file into Drive folder and metadata updates
07 Email Reply Detection | Gmail reply webhook/new thread activity | email-reply-detection worker | partially-working | stronger matching by thread/message/contact/company and richer NLP classes
08 Follow-Up Reminder Engine | scheduled due-date sweep | scheduler -> follow-up-reminder worker | stub-demo-only | reminder generation + notification delivery
09 Document PDF Export Automation | document export request | pdf-export worker | partially-working | real Google export pipeline (non-stub path)
10 Research Stage Document Generation | status -> Research | research-document worker | fully-working | optional Google Doc mirror save
11 AI Processing & Data Extraction | intake/research/draft jobs | ai-processing worker | fully-working | improve provider selection and extraction tests
12 Network Follow-Up Automation | daily contact follow-up scan | scheduler queued module | missing | implement processor logic
13 Offer Tracking Automation | reply/offer status transition | scheduler queued module + reply detector updates | partially-working | dedicated offer-tracking processor and reporting counters
14 Deadline Alert System | scheduled deadline scan | scheduler queued module | missing | implement deadline processor + notification fanout
15 Lifecycle Monitoring Engine | daily lifecycle aging scan | scheduler queued module | missing | implement lifecycle processor rules
16 Daily Status Digest | daily scheduler run | daily-digest processor | partially-working | provider fanout (Telegram primary, Slack optional) and template improvements
17 Weekly Performance Report | weekly scheduler run | weekly-report processor | partially-working | provider fanout (Telegram primary, Slack optional) and KPI enrichment
*/
