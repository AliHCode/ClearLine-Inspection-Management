# ProWay Inspections — Complete System Overview

## Introduction

ProWay Inspections is a comprehensive, production-grade construction inspection and Request For Information (RFI) management platform purpose-built for the infrastructure and construction industry. The system digitizes the entire RFI lifecycle — from filing and review to approval, rejection, carryover tracking, and compliance reporting — replacing manual paper trails and fragmented spreadsheet workflows with a unified, real-time digital environment. ProWay serves three distinct user roles — Contractors, Consultants, and Administrators — each with tailored dashboards, permissions, and functionalities that reflect real-world construction project hierarchies. The platform is designed to operate reliably even in remote construction sites with limited connectivity, featuring offline-first capabilities and automatic data synchronization.

---

## Technology Foundation

ProWay is built on a modern, scalable technology stack. The frontend is a single-page application built with React 19 and bundled with Vite for rapid development and optimized production builds. Routing is handled by React Router 7 with role-based protected routes. The backend is powered by Supabase, providing PostgreSQL as the database, built-in user authentication, real-time subscriptions, row-level security policies, and cloud file storage for image attachments. Data visualization relies on Recharts for interactive charts, while document generation uses jsPDF with the jspdf-autotable plugin for PDF exports and SheetJS (XLSX) for Excel spreadsheet output. The user interface leverages Lucide React for a consistent icon system and react-hot-toast for non-intrusive notification feedback. The application is PWA-ready with Workbox for service worker management, enabling installation on mobile devices and offline functionality through IndexedDB-based queuing.

---

## User Roles and Access Control

ProWay enforces strict role-based access control at both the application and database levels. When a new user registers, their account enters a "pending" state and they are presented with a dedicated welcome screen informing them that administrator approval is required before they can access the system. Administrators review and approve or reject registration requests from the Users management page.

**Contractors** are construction-side personnel who file RFIs daily. They can create, edit, and delete their own inspection requests, upload photographic evidence, and track the status of their submissions through a personal analytics dashboard. **Consultants** are the reviewing authority. They access a dedicated review queue where they can approve, reject, or request additional information on pending RFIs. Rejections automatically carry forward to the next business day, ensuring no inspection item is lost. **Administrators** have full system control — they manage projects, define custom fields, configure team assignments, approve user registrations, design PDF export templates, and oversee the entire platform configuration.

Database-level Row Level Security (RLS) policies enforce these boundaries at the PostgreSQL layer, ensuring that even direct API calls cannot bypass access restrictions. Users can only view RFIs within projects they are assigned to, and contractors can only modify or delete RFIs they themselves filed.

---

## Core Features and Functionalities

### RFI Lifecycle Management

The heart of ProWay is its RFI workflow engine. Contractors file RFIs against a specific date, providing a description, location, inspection type (from categories including Structural, MEP, Electrical, Plumbing, Finishing, Landscaping, Civil, HVAC, Fire Safety, and Other), and optional photographic evidence. Each RFI receives a unique serial number and enters a "pending" state.

Consultants then review pending RFIs from their review queue. They have three actions available: **Approve** (marks the RFI as completed), **Reject** (marks the RFI as failed with mandatory remarks and optional annotated evidence images), or **Request Information** (a soft rejection that asks the contractor for clarification without triggering a carryover). Bulk operations allow consultants to approve or assign multiple RFIs simultaneously, significantly improving efficiency during high-volume review periods.

When an RFI is rejected, the system automatically creates a carryover entry for the following day, incrementing the carryover count. This chain of carryovers is fully traceable — each resubmission links back to its parent RFI, building a complete lineage tree visible in the RFI detail modal. This carryover tracking mechanism is a critical compliance feature in construction project management, ensuring that failed inspections are never lost and are re-inspected on subsequent days.

### Daily RFI Sheet

The Daily RFI Sheet is the primary working interface for contractors. It presents a date-navigated view showing two distinct sections: carried-over RFIs from previous rejections and newly filed RFIs for the current date. Contractors can create new entries inline, edit existing ones through a full-featured modal dialog, upload and annotate images, and manage custom field values defined by the project administrator. The interface supports keyboard navigation and provides visual indicators for each RFI's current status.

### Image Markup and Annotation

ProWay includes a built-in canvas-based image annotation tool. When uploading evidence photos — whether during RFI creation or rejection — users can draw directly on images using adjustable brush colors and sizes. This markup capability allows consultants to highlight specific defects or areas of concern directly on site photographs, creating clear visual documentation. The annotation system maintains a full undo history and supports both mouse and touch interactions for tablet use on construction sites. All images are stored securely in Supabase's cloud storage with authenticated access controls.

### Real-Time Collaboration

The platform leverages Supabase's real-time subscription engine to deliver live updates across all connected users. When an RFI is filed, reviewed, or commented on, changes propagate instantly without manual page refreshes. Each RFI has a threaded discussion system where team members can post comments with @mention support — typing "@" triggers a dropdown of team members, and mentioned users receive targeted notifications. Comments display with user avatars (generated from name initials with deterministic color coding), timestamps, and automatic five-second polling to catch updates from other users.

### Notification System

ProWay maintains a comprehensive in-app notification system. Users receive alerts for RFI status changes, new comments, @mentions, and assignment updates. The notification center, accessible from the header bell icon, displays unread items with one-click "mark all as read" functionality. Notifications are stored in the database with per-user visibility, ensuring users only see alerts relevant to their role and project assignments.

### Audit Trail

Every action within the system is logged to an immutable audit trail. RFI creation, status changes, comment additions, image uploads, and consultant assignments all generate timestamped audit entries recording the acting user, the action performed, and relevant details. This chronological log is accessible within each RFI's detail view and serves as a compliance record for construction project documentation requirements.

---

## Analytics and Reporting

### Dashboard Analytics

Both Contractor and Consultant dashboards feature rich analytical views. Statistics cards display key metrics — total RFIs, pending count, approved count, rejected count, and information-requested count — for both the current day and overall project lifetime. A seven-day trend area chart visualizes daily RFI volume patterns, while a donut chart breaks down the status distribution across all RFIs. An activity timeline shows the most recent actions chronologically with descriptive event summaries.

### PDF Export and Template Designer

ProWay's export system goes far beyond basic document generation. The Admin Format Designer provides a full WYSIWYG (What You See Is What You Get) template editor on an A4 landscape canvas. Administrators can drag and position text blocks (titles, subtitles, project names, submission dates), multiple company logos, and configure table styling including header colors, font sizes, column labels, and grouped column headers. Templates are saved per project and applied consistently across all PDF exports.

The PDF generation engine maps canvas element positions to PDF coordinates, scales content to fit the page with proper margins on all four sides, and renders tables with bold grid lines, color-coded status values (green for approved, red for rejected, amber for pending), and proportionally sized columns that respect the widths configured in the admin panel. Excel exports preserve the same column structure with auto-sized widths and support for grouped header rows.

Daily reports include additional features: a branded header bar with project colors, summary statistic boxes, and signature lines for contractor and consultant representatives.

---

## Project and Team Management

ProWay supports multi-project environments where a single deployment serves multiple construction projects simultaneously. Administrators create projects, define project-specific custom fields (supporting text, number, select dropdown, date, and textarea field types), and assign team members with appropriate roles. Users switch between assigned projects via a header dropdown, and their view immediately updates to show only RFIs, fields, and team members relevant to the selected project.

Column configuration allows administrators to define the display order and pixel width of every table column. These widths persist across sessions and directly influence PDF export column proportions, ensuring visual consistency between the on-screen table and printed documents. The column resize interface provides drag handles on each header with live width feedback and double-click reset to defaults.

---

## Offline-First Architecture

Recognizing that construction sites frequently lack reliable internet connectivity, ProWay implements an offline-first submission system. When a contractor files an RFI without an active network connection, the submission is serialized — including base64-encoded image attachments — and stored in the browser's IndexedDB database. A pending sync counter appears in the interface, and when connectivity is restored, the system automatically synchronizes queued submissions to the server. The authentication layer also caches user profiles in localStorage, allowing previously authenticated users to continue working across brief connectivity interruptions without being logged out.

---

## Security Architecture

Security is enforced at multiple layers. Supabase handles authentication with secure token management, password hashing, and session handling. Database-level Row Level Security policies restrict data access based on user identity and role — contractors can only delete their own RFIs, users can only view RFIs within their assigned projects, and notifications are private to their recipients. Deactivated and archived user accounts are blocked at the authentication layer before any data access occurs. The application's protected route wrapper performs client-side role verification, and the ProtectedRoute component redirects unauthorized users to their appropriate home page, preventing access to admin or cross-role functionalities.

---

## Onboarding Experience

New administrators are guided through a multi-step onboarding wizard that walks them through creating their first project, inviting team members, and confirming their setup. New users who register see a clean, branded welcome screen while awaiting administrator approval, and rejected users receive a clear denial message with guidance to contact their project manager. This structured onboarding ensures that every user's first interaction with ProWay is guided and professional.

---

## Summary

ProWay Inspections is a complete, end-to-end digital solution for construction RFI management. It replaces disconnected paper-based workflows with a real-time, role-aware, offline-capable platform that handles everything from daily inspection filing to consultant review, automated carryover tracking, image annotation, compliance audit logging, and professional PDF report generation. Every feature has been designed with the realities of construction project management in mind — unreliable connectivity, strict compliance requirements, multi-stakeholder collaboration, and the need for clear, traceable documentation at every step.
