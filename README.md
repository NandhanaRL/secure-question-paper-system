# 1. Project Title
Secure Cloud-Based Just-in-Time Question Paper Generation and Management System

## 2. Introduction
This project is an academic prototype developed to address one of the most critical vulnerabilities in examination management: the premature leakage of question papers. By re-architecting how a question paper is assembled and delivered, this system significantly enhances the integrity of competitive assessments using modern web technologies.

## 3. Problem Statement
**Traditional approach:**
The complete question paper is prepared and stored before the examination.

**Security problem:**
That stored complete paper becomes a high-value target for unauthorized access and leakage. Whether through compromised accounts, database extraction, or insider threats, the existence of a completed document prior to the exam creates a severe vulnerability.

## 4. Proposed Solution
**Our approach:**
1. Individual questions are stored securely in a fragmented Question Bank.
2. An examination blueprint defines the required paper structure (e.g., number of easy/medium/hard questions).
3. At the scheduled examination time, the system randomly selects appropriate questions and dynamically generates the paper.

Therefore, the complete final question paper does not need to exist as a stored document before the examination. This is the main innovation of the system.

## 5. Objectives
- Eliminate the pre-exam storage of final question papers.
- Provide a secure repository for atomic examination questions.
- Dynamically enforce academic standards through Exam Blueprints.
- Ensure strict time-bound access for examination centers.
- Provide a clear, immutable audit trail of system events.

## 6. Main Features
- **Just-in-Time (JIT) Generation:** The core engine that randomly assembles questions exactly at the time of the exam.
- **Role-Based Portals:** Separate interfaces for Administrators and Examination Centers.
- **Time-Bound Enforcement:** The paper generation endpoint explicitly locks when the exam window expires.
- **Audit Logging:** Comprehensive tracking of logins, exam creation, and paper retrieval.
- **Minimalistic Student Architecture:** Clean separation of concerns (Frontend UI + Backend REST API + Relational Database).

## 7. System Workflow
1. **Admin** logs into the dashboard and populates the **Question Bank** with categorized questions.
2. **Admin** schedules an **Exam** and assigns a **Blueprint** (rules for difficulty and subject distribution).
3. **Admin** marks the exam as `ACTIVE`.
4. At the scheduled time, the **Examination Centre** logs into the candidate portal.
5. The system performs the **Just-in-Time Paper Generation**, compiling the random questions directly into the API response without writing to the database.
6. The Centre conducts the exam securely.
7. Access is revoked entirely once the exam window expires.

## 8. Security Features
- **Stateless Just-in-Time Engine:** The most critical defense; the paper simply does not exist to be stolen before the exam.
- **JSON Web Tokens (JWT):** Cryptographically signed tokens handle stateless authentication.
- **Token Binding:** Examination Centre tokens are strictly bound to their requested `examId` to prevent cross-exam unauthorized access.
- **Password Hashing:** `bcrypt` ensures passwords are never stored in plaintext.
- **Audit Trails:** Permanent, read-only logs of sensitive actions.

## 9. Technology Stack
- **Frontend:** React, Next.js, Tailwind CSS
- **Backend:** Node.js, Express.js, TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma ORM

## 10. Database
The system uses a straightforward PostgreSQL schema:
- **User:** Admin and Center credentials.
- **Question:** The secure, atomic question bank.
- **Exam & ExamBlueprint:** Examination schedules and generation rules.
- **Session:** Tracks active center logins.
- **AuditLog:** Records system events.

## 11. Project Structure
- `packages/admin-dashboard/`: Next.js web application for administrators.
- `packages/candidate-portal/`: Next.js web application for examination centers.
- `packages/backend/`: Node.js Express REST API server.
- `packages/shared/`: Shared TypeScript models and validation schemas.

## 12. How to Run Locally
1. Ensure Node.js (v18+) and PostgreSQL are installed.
2. Clone the repository and run `npm install`.
3. Set up the `.env` file using the provided `.env.example`.
4. Generate the database schema:
   ```bash
   cd packages/backend
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```
5. Start the backend: `npm run dev` in `packages/backend`.
6. Start the frontends: `npm run dev` in both `packages/admin-dashboard` and `packages/candidate-portal`.

## 13. Sample Workflow
To test the system locally:
1. Log in to the Admin Dashboard (default seeded credentials: `admin@securejit.com`).
2. Navigate to "Question Bank" and add several questions of varying difficulty.
3. Navigate to "Exams", create an exam for the current time, and assign a blueprint.
4. Open the Candidate Portal in an incognito window.
5. Log in using the Exam ID created in step 3.
6. Observe the Just-in-Time paper generation. 
7. Check the Admin Dashboard's "Audit Logs" to verify the retrieval was recorded.

## 14. Limitations
- The system is an academic prototype and does not feature enterprise integrations like external SSO or biometric candidate verification.
- It addresses pre-exam digital leakage but does not prevent physical leakage (e.g., photographing the screen) during the active exam window.

## 15. Future Scope
- **Browser Lockdown:** Integration with WebRTC and secure browsers to prevent tab-switching during the exam.
- **End-to-End Encryption:** Encrypting the generated JIT payload with a client-side public key to protect against middlebox interception.
