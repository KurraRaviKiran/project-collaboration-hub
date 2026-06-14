# Student Project Collaboration Hub

A full-stack web application that enables students to discover projects, build teams, manage project members, and collaborate on academic and personal projects.

## Overview

Student Project Collaboration Hub helps students connect with peers who share similar interests and skills. Project owners can create projects, define required skills, review join requests, and manage team members throughout the project lifecycle.

The platform provides a centralized space for project discovery and team formation without requiring external collaboration tools.

---

## Features

### Authentication & User Management

* Secure user registration and login
* Profile management
* Skill-based user profiles
* Interest-based project discovery

### Project Management

* Create new projects
* Edit project details
* View project information
* Track project status and progress
* Project ownership management

### Team Collaboration

* Browse available projects
* Send join requests
* Accept or reject join requests
* Manage project members
* View joined projects

### Dashboard

* Overview of created projects
* Joined projects section
* Pending join requests
* Incoming join requests
* Project statistics

### User Profile

* Update personal information
* Add skills
* Specify interested fields
* Manage profile details

---

## Technology Stack

### Frontend

* React.js
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui

### Backend

* Supabase

### Database

* PostgreSQL (Supabase)

### Authentication

* Supabase Authentication

---

## Database Schema

### Profiles

Stores user information.

| Field             | Description       |
| ----------------- | ----------------- |
| id                | User ID           |
| full_name         | User's full name  |
| email             | Email address     |
| skills            | User skills       |
| interested_fields | Areas of interest |
| bio               | User bio          |

### Projects

Stores project details.

| Field           | Description           |
| --------------- | --------------------- |
| id              | Project ID            |
| title           | Project title         |
| description     | Project description   |
| owner_id        | Project creator       |
| required_skills | Required skills       |
| status          | Project status        |
| progress        | Completion percentage |

### Join Requests

Stores requests sent by users to join projects.

| Field      | Description                   |
| ---------- | ----------------------------- |
| id         | Request ID                    |
| project_id | Related project               |
| user_id    | Applicant                     |
| status     | Pending / Accepted / Rejected |

### Project Members

Stores accepted team members.

| Field      | Description     |
| ---------- | --------------- |
| id         | Member ID       |
| project_id | Related project |
| user_id    | Team member     |
| role       | Member role     |

---

## Workflow

1. User registers and creates a profile.
2. User browses available projects.
3. Project owner creates a project and specifies required skills.
4. Interested users send join requests.
5. Project owner reviews requests.
6. Accepted users become project members.
7. Team members track project progress through the platform.

---

## Installation

### Clone Repository

```bash
git clone https://github.com/KurraRaviKiran/project-collaboration-hub.git
cd project-collaboration-hub
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Start Development Server

```bash
npm run dev
```

---

## Future Enhancements

* AI-based project recommendations
* Skill matching system
* Advanced project search and filtering
* Team performance analytics
* Project completion certificates
* Project rating and feedback system
* Internship and hackathon project support

---

## Learning Outcomes

This project demonstrates:

* Full-Stack Web Development
* Authentication and Authorization
* Database Design
* CRUD Operations
* Role-Based Access Control
* Team Collaboration Workflow
* React and TypeScript Development
* Supabase Integration

---

## Author

**Kurra Ravi Kiran**

LinkedIn: https://www.linkedin.com/in/kurra-ravi-kiran-822096414/

Email: [ravikiranmlw@gmail.com](mailto:ravikiranmlw@gmail.com)
