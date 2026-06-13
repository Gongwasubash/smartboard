# Security Specification - Firebase Security TDD

## 1. Data Invariants
- **Classes**: Cannot have empty names. ID format must match '^[a-zA-Z0-9_\-]+$'. Size limits apply.
- **Subjects**: Must reference an existing class ID. Must have a valid title.
- **Chapters**: Must reference an existing subject ID. Must have a valid title.
- **Topics**: Must reference an existing chapter ID. Must have a title and content.
- **Videos**: Must reference a chapter ID. Must have a valid video url.
- **Writers must be authenticated**: Only signed-in users can write to these collections.
- **Immutability**: Once created, ID references cannot be mutated (e.g., changing `classId` of a subject, or `chapterId` of a topic is prohibited).

## 2. The "Dirty Dozen" Payloads (Identity, Integrity, State Violations)
1. **Unauthenticated Class Creation**: Attempt to create `/classes/class-99` without log-in.
2. **Resource Poisoning (Huge ID)**: Attempt to create `/classes/` with an ID length of 10,000 characters.
3. **Empty Class Name**: Attempt to write `{ "id": "class-test", "name": "" }` to `/classes/class-test`.
4. **Missing Required Fields**: Attempt to write a Subject without a `classId`.
5. **Orphaned Room / Broken Relationship**: Write a Chapter with a random, non-existent `subjectId`.
6. **Class Reference Tampering (Subject Edit)**: Attempt to update `/subjects/subject-1` to modify its immutable `classId`.
7. **Identity Spoofing**: Attempt to update metadata or write systems by mimicking other administrator IDs.
8. **Malicious Topic Content Bloat**: Topic written with a size greater than 10MB of reference text.
9. **Video URL Spoofing**: Write a video object with a non-string or blank `videoUrl`.
10. **State Shortcutting with Garbage Schema**: Inject shadow values like `{ "isAdmin": true }` inside custom curriculum nodes.
11. **Malicious Delete**: Delete a Class document while unauthenticated.
12. **Bypassing Server Timestamps**: Forcing a client-side falsified `createdAt` field that differs from the server's time.

## 3. Core Test Logic / Assertions
- All unauthenticated writes to `classes`, `subjects`, `chapters`, `topics`, `videos` are rejected with `PERMISSION_DENIED`.
- All writes matching standard helpers require valid authenticated users.
