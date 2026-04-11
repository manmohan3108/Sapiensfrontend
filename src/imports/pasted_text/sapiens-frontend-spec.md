# Frontend Development Prompt — Sapiens Cognitive System

You are building the frontend web application for a system called Sapiens.

Sapiens is a platform where users can create and interact with artificial cognitive systems modeled after human-like thinking. Each instance is called a Sapiens (not an agent). Users can create multiple Sapiens and interact with them by providing inputs such as files or text.

The frontend must be clean, modular, scalable, and easy to maintain, following SOLID principles and good software architecture.

Use React + TypeScript as the primary framework.

The design should resemble developer tools or AI dashboards: clean, minimal, and professional.

---

# General Requirements

Follow these architectural principles:

- SOLID principles
- Separation of concerns
- Modular component structure
- Centralized backend configuration
- Service layer for backend communication
- Avoid direct API calls from UI components
- Use strong typing (TypeScript)

The code should be production-quality and scalable.

---

# Backend API Overview

Assume the backend exposes the following APIs:

POST /create_sapiens  
POST /load_sapiens  
POST /save_sapiens  
POST /handle_files  
POST /text_input  
GET /sapiens_state  

Every request uses:

sapiens_id

---

# Number of Pages

The application should have only two main pages.

1. Landing Page  
2. Sapiens Workspace

Keep the UI simple and focused.

---

# Page 1 — Landing Page

This is the main entry screen explaining the system.

Purpose:
- Introduce what Sapiens is
- Allow creating or loading a Sapiens

Sections:

### Hero Section
Display product title and description.

Example content:

Title:  
Sapiens — Cognitive AI Architecture

Description:  
A system designed to experiment with artificial cognition.  
Create Sapiens instances, feed them information, and observe how they process knowledge.

Buttons:
- Create Sapiens
- Load Existing Sapiens

---

### Create Sapiens Panel

Fields:

Name  
Role (optional)

Button:

Create Sapiens

This calls:

POST /create_sapiens

After creation, redirect to the workspace.

---

### Load Existing Sapiens

Display list of previously saved Sapiens.

Selecting one calls:

POST /load_sapiens

After loading, redirect to the workspace.

---

# Page 2 — Sapiens Workspace

This is the main working environment.

The workspace allows the user to:

- provide inputs
- observe system activity
- see outputs
- manage the current Sapiens

---

# Workspace Layout

Suggested layout:

Top Header  
Current Sapiens information and actions

Left Panel  
File input and text input

Right Panel  
System activity logs

Bottom Panel  
Output / responses

---

# Workspace Components

## Header

Display:

Sapiens name  
Role  
Sapiens ID

Buttons:

Save Sapiens  
Return to Home

Save calls:

POST /save_sapiens

---

## File Upload Panel

Allows uploading files or folders.

Supported examples:

pdf  
text files  
documents

On upload call:

POST /handle_files

Parameters:

sapiens_id  
files

Show upload progress.

---

## Text Input Panel

Simple input box where users can send text input.

Send button triggers:

POST /text_input

Parameters:

sapiens_id  
text

---

## Activity Log Panel

Shows system events.

Examples:

Loading memories  
Processing input  
Running cognitive engines  
Updating memory  
Processing complete

Display logs in chronological order.

---

## Output Panel

Shows system responses or results generated from inputs.

Display in a chat or console style format.

---

# Frontend Architecture

Use a modular folder structure.

Suggested structure:

src/

core/
config/
apiConfig.ts
environment.ts

api/
apiClient.ts
sapiensApi.ts

services/
sapiensService.ts

state/
sapiensStore.ts

components/

landing/
HeroSection.tsx
CreateSapiensForm.tsx
LoadSapiensList.tsx

workspace/
HeaderBar.tsx
FileUploadPanel.tsx
TextInputPanel.tsx
ActivityLog.tsx
OutputConsole.tsx

pages/
LandingPage.tsx
WorkspacePage.tsx

layouts/
MainLayout.tsx

hooks/
useSapiens.ts
useApi.ts

types/
sapiensTypes.ts
apiTypes.ts

utils/
logger.ts
formatters.ts

---

# Backend Configuration

Create a centralized backend configuration.

File:

core/config/apiConfig.ts

This should contain:

Base API URL  
Default headers  
Timeout configuration

All API calls must use this configuration.

---

# API Client

Create a reusable HTTP client.

File:

core/api/apiClient.ts

Responsibilities:

HTTP requests  
Error handling  
Request configuration  
Timeout handling

---

# Service Layer

Create a service layer for Sapiens operations.

File:

core/services/sapiensService.ts

Functions should include:

createSapiens()  
loadSapiens()  
saveSapiens()  
uploadFiles()  
sendTextInput()  
getSapiensState()

UI components should call services, not APIs directly.

---

# State Management

Create a centralized state store.

File:

core/state/sapiensStore.ts

Store:

currentSapiens  
activityLogs  
outputs  
status

Use a lightweight library such as:

Zustand  
Redux Toolkit  
or Context API

---

# UI Design Guidelines

The interface should be:

Clean  
Minimal  
Developer-oriented  

Use a modern UI library such as:

TailwindCSS  
or Material UI

Optional features:

Dark mode  
Loading spinners  
Upload progress bars  
Auto-scroll activity logs

---

# Important Notes

Never hardcode Sapiens.

Users must always create Sapiens dynamically using the interface.

The frontend must remain flexible and extensible, because the backend cognitive system will evolve over time.

---

# Final Deliverable

Generate a complete frontend project including:

Project structure  
Components  
Pages  
API layer  
Service layer  
State management  
Basic styling

The result should be a working frontend skeleton ready to connect to the backend APIs.