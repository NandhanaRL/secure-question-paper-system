# Security Model: Secure Cloud-Based Just-in-Time Question Paper Generation and Management System

This document outlines the threat model, attack surfaces, and security controls for the Just-in-Time (JIT) examination system.

## 1. Threat Model & Attack Surface

The core objective of the system is to **prevent premature question-paper leakage**. In conventional examination systems, a complete final question paper is stored in a database, on disk, or transferred physically before the examination begins. This creates a highly vulnerable attack surface.

**Potential Attack Vectors in Conventional Systems:**
- Database compromise (SQL injection, leaked credentials) exposing the stored paper.
- Insider threats (administrators or staff with access to the final paper).
- Compromised examination center infrastructure gaining early access to the paper.

**JIT Attack Surface:**
- The Question Bank (individual questions).
- The Exam Blueprint (the rules for generating the paper).
- The Just-in-Time Generation Endpoint.

## 2. Implemented Security Controls

### Just-in-Time (JIT) Generation Mechanism
**This is the core security innovation of the project.**
- **No Permanent Storage**: The final question paper is *never* stored in the database. 
- **Dynamic Assembly**: When an authorized examination center requests the paper at the scheduled time, the backend dynamically queries the secure question bank, applies the examination blueprint (e.g., 5 hard, 10 medium, 5 easy questions), and returns a randomized paper directly in the API response.
- **Randomization**: Even if two centers request the paper for the same exam, they may receive different permutations or a different subset of questions, minimizing the value of a leak if one center is compromised at the exact moment of the exam.

### Authentication and Authorization
- **JWT Authentication**: All sessions are authenticated using JSON Web Tokens (JWT). Passwords are securely hashed using `bcrypt` before storage.
- **Role-Based Access Control (RBAC)**: 
  - `ADMIN`: Full access to manage the question bank and blueprints.
  - `CENTER` / `CANDIDATE`: Restricted exclusively to joining active sessions and requesting the JIT paper.
- **Token Binding (IDOR Protection)**: Center tokens are strictly bound to a specific `examId` at the time of login. A compromised center token cannot be manipulated to fetch papers for other active exams.

### Time-Bound Expiration & Status Checks
- **Strict Active Window**: The JIT generation endpoint (`GET /api/v1/exams/:id/paper`) validates two conditions:
  1. The exam's status must be `ACTIVE`.
  2. The current server time must be within a hard 4-hour window from the exam's `scheduledTime`. 
- This acts as a defense-in-depth measure. Even if an administrator forgets to mark an exam as completed, the system automatically locks out JIT generation after 4 hours, preventing delayed extraction.

### Audit Logging
- Every sensitive action is permanently recorded in the `AuditLog` table.
- Monitored actions include: `LOGIN_FAILED`, `EXAM_CREATE`, `EXAM_ACTIVATE`, `PAPER_ACCESS`, and `PAPER_GENERATION`.
- Logs include the actor's ID, role, IP address, and detailed JSON context, providing a non-repudiable trail of who generated papers and when.

## 3. Simulated Security vs. Future Improvements

*Note: As this is a prototype academic project, certain security features are simulated or require future enhancements for production readiness.*

**Simulated Security:**
- **Candidate Database Verification**: The `/center-login` endpoint currently simulates candidate verification. In a production system, it would rigorously verify the `admitCard` against a dedicated candidate registry.
- **Infrastructure Security**: We assume the PostgreSQL database itself is secured within a private VPC. The application does not currently implement application-layer encryption (e.g., envelope encryption) for individual question text at rest.

**Known Limitations & Future Improvements:**
- **In-Transit Encryption (TLS/SSL)**: Production deployment must enforce HTTPS/TLS to protect the JWTs and the JIT paper during transit to the examination center.
- **DDoS and Rate Limiting**: The system currently lacks rate-limiting on the JIT generation endpoint, which could be abused in a Denial of Service attack at the start of an exam.
- **End-to-End Encryption (E2EE)**: Future iterations should explore encrypting the JIT paper using a public key provided by the center during login, ensuring the paper is fully opaque even to middleboxes or compromised CDNs.
