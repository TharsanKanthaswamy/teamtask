# TeamTrack User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Super Admin Guide](#super-admin-guide)
3. [Team Lead Guide](#team-lead-guide)
4. [Project Lead Guide](#project-lead-guide)
5. [Team Member Guide](#team-member-guide)
6. [Glossary](#glossary)

---

## Getting Started

### First Login

1. Navigate to the TeamTrack URL provided by your administrator
2. Enter your email and password
3. Click "Sign In"

**First-time users:** Your Team Lead or administrator will create your account and send you credentials.

### Understanding Your Role

TeamTrack has four roles with increasing permissions:

| Role | Permissions |
|------|-------------|
| **Team Member** | View team projects, submit work, track personal progress |
| **Project Lead** | Manage project tasks, review contributions, track project metrics |
| **Team Lead** | Create projects, manage team members, oversee all team work |
| **Super Admin** | Manage all teams, create teams, view global analytics |

Your role determines which features you can access.

---

## Super Admin Guide

### Overview

Super Admins manage the entire TeamTrack platform. You can create teams, assign Team Leads, and monitor performance across all teams.

### Dashboard

Your dashboard shows:
- **Total Teams** — All teams in the system
- **Global Completion Rate** — Average progress across all teams
- **Top Performing Teams** — Teams with highest completion rates
- **Review Bottlenecks** — Teams with pending reviews
- **Platform Activity** — Recent actions across all teams

### Managing Teams

#### Create a Team

1. Click **"Create Team"** in the top navigation
2. Fill in team details:
   - **Team Name** (required)
   - **Description** (optional)
3. Click **"Create"**

#### Assign a Team Lead

1. Navigate to the team's page
2. Click **"Team Settings"**
3. Click **"Add Member"**
4. Select user and set role to **"Team Lead"**
5. Click **"Add"**

**Best Practice:** Always assign a Team Lead when creating a team. Teams without leads cannot create projects.

#### View Team Analytics

1. Navigate to **"Analytics"** → **"Teams"**
2. Select a team from the list
3. View metrics:
   - Active projects
   - Completion rate
   - Member performance
   - Deadline adherence

### Global Analytics

Access comprehensive platform insights:

**Navigation:** Dashboard → Analytics → Global

**Metrics Available:**
- Total users across all teams
- Total projects (active, completed, archived)
- Average task completion time
- Teams ranked by performance
- Users ranked by contribution

**Export Reports:**
1. Click **"Export"** button
2. Select format (CSV or PDF)
3. Choose date range
4. Click **"Generate Report"**

### Managing Users

#### View All Users

**Navigation:** Settings → Users

Shows all users across all teams with:
- Email
- Teams they belong to
- Roles
- Last active date
- Status (Active/Inactive)

#### Deactivate a User

1. Find user in the list
2. Click **"•••"** (options menu)
3. Select **"Deactivate"**
4. Confirm action

**Note:** Deactivated users cannot log in but their historical data remains.

---

## Team Lead Guide

### Overview

Team Leads manage a single team. You create projects, assign Project Leads, manage team membership, and monitor team performance.

### Dashboard

Your dashboard shows:
- **Team Completion Rate**
- **Active Projects**
- **Team Members** — Quick view of members and their workload
- **Upcoming Deadlines**
- **Recent Activity**

### Managing Projects

#### Create a Project

1. Navigate to your team's workspace
2. Click **"Create Project"**
3. Fill in project details:
   - **Project Name** (required)
   - **Description**
   - **Project Lead** (required) — Select a team member
   - **Start Date**
   - **Target End Date**
   - **Status** — Draft, Active, On Hold, Completed, Archived
   - **Priority** — Low, Medium, High, Critical
4. Click **"Create Project"**

**Best Practice:** Always assign a Project Lead. They will manage day-to-day task assignments and reviews.

#### Edit Project Details

1. Open project
2. Click **"Settings"** tab
3. Edit fields
4. Click **"Save Changes"**

**You can change:**
- Project name and description
- Project Lead
- Dates
- Status and priority

#### Archive a Project

1. Open project
2. Click **"Settings"** tab
3. Change status to **"Archived"**
4. Confirm

**Note:** Archived projects are read-only but remain accessible for reporting.

### Managing Team Members

#### Add a Team Member

1. Navigate to **"Team"** → **"Members"** tab
2. Click **"Add Member"**
3. Enter user details:
   - Email (required)
   - Name (required)
   - Role — Member or Project Lead
4. Click **"Send Invite"**

**The user receives an email with login credentials.**

#### Change Member Role

1. Navigate to **"Team"** → **"Members"** tab
2. Find member in list
3. Click role dropdown
4. Select new role
5. Confirm change

**Available Roles:**
- **Member** — Can be assigned to tasks, submit work
- **Project Lead** — Can create tasks, review work, manage project members

#### Remove a Team Member

1. Navigate to **"Team"** → **"Members"** tab
2. Find member
3. Click **"•••"** (options menu)
4. Select **"Remove from Team"**
5. Confirm

**Note:** Removing a member removes them from all team projects. Their historical contributions remain.

### Team Analytics

**Navigation:** Team → Analytics

**Available Metrics:**
- **Team Completion Rate** — Overall progress across all projects
- **Project Distribution** — Breakdown by status (active, completed, etc.)
- **Member Performance** — Individual contribution metrics
- **Workload Distribution** — How tasks are distributed across members
- **Deadline Performance** — On-time vs. late completion rates

**Export Team Report:**
1. Click **"Export Report"**
2. Select date range
3. Choose format (CSV or PDF)
4. Click **"Generate"**

---

## Project Lead Guide

### Overview

Project Leads manage individual projects. You create tasks, assign contributors, review submitted work, and track project progress.

### Dashboard

Your dashboard shows:
- **Your Projects** — All projects where you're the lead
- **Pending Reviews** — Contributions awaiting your approval
- **Project Completion** — Progress gauges for each project
- **Upcoming Deadlines** — Tasks due soon
- **Team Availability** — Member workload status

### Managing Tasks

#### Create a Task

1. Open your project
2. Click **"Tasks"** tab
3. Click **"Create Task"**
4. Fill in task details:
   - **Title** (required)
   - **Description** — What needs to be done
   - **Priority** — Low, Medium, High, Critical
   - **Weight** — Relative importance (1-10, default: 1)
   - **Milestone** (optional) — Link to project milestone
   - **Start Date** (optional)
   - **Due Date** (optional)
5. Click **"Create"**

**Task Weight:** Used to calculate project completion. A weight-3 task counts 3× more than a weight-1 task toward project progress.

#### Edit a Task

1. Open task detail view
2. Click **"Edit"**
3. Update fields
4. Click **"Save"**

#### Change Task Status

Tasks follow this lifecycle:

```
BACKLOG → TODO → IN_PROGRESS → IN_REVIEW → COMPLETED
                     ↓
                  BLOCKED
```

**To change status:**
1. Open task
2. Click status dropdown
3. Select new status

**Status Meanings:**
- **BACKLOG** — Not yet ready to start
- **TODO** — Ready to be worked on
- **IN_PROGRESS** — Currently being worked on
- **IN_REVIEW** — Work submitted, awaiting approval
- **BLOCKED** — Cannot proceed due to external dependency
- **COMPLETED** — Approved and done
- **CANCELLED** — No longer needed

#### Delete a Task

1. Open task
2. Click **"•••"** (options menu)
3. Select **"Delete Task"**
4. Confirm

**Note:** Deleted tasks cannot be recovered. Consider setting status to CANCELLED instead.

### Assigning Tasks

#### Assign a Single Contributor

1. Open task
2. Click **"Assign"** button
3. Select team member
4. Set **Allocated Weight** to **100%**
5. Add **Responsibility** (optional) — Brief description of their role
6. Click **"Assign"**

#### Assign Multiple Contributors (Shared Task)

When multiple people work on the same task, divide the weight among them:

1. Open task
2. Click **"Assign"** button
3. Select first team member
4. Set **Allocated Weight** — Their percentage (e.g., 40%)
5. Add **Responsibility** — What they're responsible for
6. Click **"Assign"**
7. Repeat for additional contributors

**Example: Frontend + Backend Task**
- Alice (Backend): 60% weight — "API implementation"
- Bob (Frontend): 40% weight — "UI components"

**Rules:**
- Total allocated weight must equal **100%**
- Cannot exceed 100%
- Each member can only be assigned once per task

#### Unassign a Contributor

1. Open task
2. Find assignee in the list
3. Click **"✕"** (remove button)
4. Confirm

### Reviewing Contributions

#### View Pending Reviews

**Navigation:** Dashboard → Pending Reviews

Shows all contributions awaiting your approval.

#### Review a Contribution

1. Click on pending review
2. Review details:
   - **Progress Reported** — Percentage claimed
   - **Hours Spent**
   - **Description** — What was completed
   - **Evidence** — Links or files (if provided)
   - **Historical Progress** — Previous submissions
3. Make a decision:

**Option A: Approve**
1. Click **"Approve"**
2. Add **Feedback** (optional but recommended)
3. Click **"Confirm"**

**Option B: Request Changes**
1. Click **"Request Changes"**
2. Add **Feedback** (required) — Explain what needs fixing
3. Click **"Confirm"**

**Option C: Reject**
1. Click **"Reject"**
2. Add **Feedback** (required) — Explain why
3. Click **"Confirm"**

**Best Practices:**
- Review contributions within 24 hours
- Always provide feedback — helps team members improve
- Check evidence links if provided
- Look at progress history to verify consistency

### Project Analytics

**Navigation:** Project → Analytics

**Available Metrics:**
- **Project Completion** — Overall progress (reported vs. approved)
- **Task Breakdown** — By status (in progress, completed, etc.)
- **Contributor Overview** — Individual progress for each member
- **Milestone Progress** — Completion by milestone
- **Deadline Performance** — On-time vs. late completions
- **Hours Logged** — Total effort recorded

**Export Project Report:**
1. Click **"Export Report"**
2. Select date range
3. Choose metrics to include
4. Select format (CSV or PDF)
5. Click **"Generate"**

---

## Team Member Guide

### Overview

Team Members are assigned to tasks, submit progress updates, and track personal performance.

### Dashboard

Your dashboard shows:
- **My Tasks** — All tasks assigned to you
- **Progress Summary** — Your completion statistics
- **Recent Contributions** — Your submitted work
- **Notifications** — Task assignments, approvals, feedback
- **Personal Analytics** — Your performance metrics

### Working on Tasks

#### View Your Tasks

**Navigation:** Dashboard → My Tasks

**Filter by:**
- Status (Todo, In Progress, In Review, Completed)
- Priority (Critical, High, Medium, Low)
- Project

#### Update Task Status

When you start working:
1. Click on task
2. Change status to **"In Progress"**

When blocked:
1. Open task
2. Change status to **"Blocked"**
3. Add comment explaining the blocker

### Submitting Progress

#### Submit a Progress Update

1. Open your task
2. Click **"Submit Progress"**
3. Fill in the form:
   - **Progress Percentage** (0-100) — How complete is the task?
   - **Hours Spent** (optional but recommended)
   - **Description** (required) — What did you accomplish?
   - **Evidence URL** (optional) — Link to PR, document, etc.
4. Click **"Submit"**

**Rules:**
- Progress cannot decrease
- You can only submit for tasks assigned to you
- Description must be meaningful (minimum 10 characters)

**Example:**
```
Progress: 50%
Hours: 4
Description: Completed backend API endpoints for user authentication. 
All unit tests passing. Code review pending.
Evidence: https://github.com/team/repo/pull/123
```

#### View Your Progress History

1. Open task
2. Click **"History"** tab

Shows all your previous submissions with dates, progress, and descriptions.

#### Submit for Review

When task is complete:
1. Ensure progress is 100%
2. Click **"Submit for Review"**
3. Confirm

**Your Project Lead will be notified and can approve your work.**

### Understanding Progress Types

**Reported Progress** — What you claim is complete  
**Approved Progress** — What your Project Lead has verified

**Example:**
- You report 100% progress
- Project Lead approves it
- Your approved progress updates to 100%
- This now counts toward project completion

### Receiving Feedback

#### View Review Feedback

**Navigation:** Dashboard → Notifications

Look for notifications with type:
- **Work Approved** ✅
- **Changes Requested** ⚠️
- **Work Rejected** ❌

Click notification to view feedback.

#### Responding to Change Requests

1. Read Project Lead's feedback
2. Make requested changes
3. Update task status back to **"In Progress"**
4. When fixed, submit new progress update
5. Submit for review again

### Personal Analytics

**Navigation:** Dashboard → My Performance

**Available Metrics:**
- **Completion Rate** — Percentage of assigned tasks completed
- **On-Time Rate** — Tasks completed by deadline
- **Total Contributions** — Number of progress submissions
- **Total Hours Logged**
- **Average Task Duration**
- **Contribution Timeline** — Visual history of your work

**Export Personal Report:**
1. Click **"Export Report"**
2. Select date range
3. Choose format (CSV or PDF)
4. Click **"Generate"**

**Use this for:**
- Performance reviews
- Time tracking
- Personal productivity analysis

---

## Glossary

**Allocated Weight** — Percentage of a task assigned to a contributor (must sum to 100% across all assignees)

**Approved Progress** — Progress verified and approved by Project Lead; counts toward project completion

**Contribution** — A progress update submitted by a team member

**Evidence** — Supporting documentation for submitted work (e.g., PR links, screenshots)

**Milestone** — A significant checkpoint in a project with its own deadline

**Reported Progress** — Progress claimed by a team member; awaiting approval

**Review** — Process where Project Lead evaluates submitted work

**Task Weight** — Relative importance of a task; heavier tasks count more toward project completion

**Tenant** — An isolated team workspace; teams cannot access each other's data

**Workspace** — The main area for a team or project containing tasks, members, and analytics

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Open command palette |
| `C` | Create new task (on task list) |
| `Esc` | Close dialog/modal |
| `?` | Show keyboard shortcuts |
| `/` | Focus search |
| `N` | View notifications |

---

## Getting Help

**Technical Issues:**
- Contact your Team Lead or Super Admin
- Check system status at your organization's status page

**Feature Requests:**
- Submit via your organization's feedback channel
- Discuss with your Team Lead

**Security Concerns:**
- Email: security@teamtrack.local
- Do not share credentials or sensitive data

---

## Best Practices

### For All Users

✅ **Update progress regularly** — Don't wait until a task is 100% done  
✅ **Use meaningful descriptions** — Help your team understand what you did  
✅ **Check notifications daily** — Stay informed about assignments and feedback  
✅ **Set realistic deadlines** — Account for dependencies and complexity  
✅ **Communicate blockers early** — Don't wait until the deadline

### For Project Leads

✅ **Review contributions promptly** — Within 24 hours when possible  
✅ **Provide constructive feedback** — Help team members improve  
✅ **Break large tasks into smaller ones** — Easier to track and manage  
✅ **Use task weights thoughtfully** — Reflect true complexity and importance  
✅ **Monitor team workload** — Avoid overloading any one person

### For Team Leads

✅ **Assign clear Project Leads** — Every project should have an owner  
✅ **Monitor team analytics** — Identify bottlenecks and struggling members  
✅ **Hold regular check-ins** — Don't rely solely on the tool  
✅ **Recognize good work** — Use feedback to celebrate achievements  
✅ **Keep team membership updated** — Remove inactive members promptly

### For Super Admins

✅ **Monitor cross-team performance** — Identify and share best practices  
✅ **Ensure every team has an active Team Lead**  
✅ **Review security audit logs regularly**  
✅ **Archive completed teams** — Keep the platform organized  
✅ **Plan for growth** — Monitor resource usage and scaling needs

---

**Last Updated:** 2026-11-13  
**Version:** 1.0.0  
**Need Help?** Contact your administrator or visit the TeamTrack documentation portal.
