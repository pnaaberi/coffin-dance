# gameplay-verification Specification

## Purpose
TBD - created by archiving change verify-gameplay. Update Purpose after archive.

## Requirements

### Requirement: Server-authoritative run scoring
The system SHALL derive published scores by replaying inputs against a server-issued random seed and fixed versioned game rules.
#### Scenario: Valid completed run
- **WHEN** a started run reaches death through valid inputs and misses
- **THEN** the server calculates and stores its score without trusting submitted score or level values
#### Scenario: Forged score or progression
- **WHEN** a caller submits score fields, invalid lanes, skipped levels or inputs after death
- **THEN** the request is rejected without creating a score

### Requirement: Ordered timed sessions
The system SHALL expire runs, bind them to an unguessable token, order checkpoints, bound elapsed time and account for pauses.
#### Scenario: Pause and resume
- **WHEN** a run is paused and later resumed
- **THEN** paused wall time does not advance playable time and the next checkpoint resumes the same state
#### Scenario: Stale or accelerated requests
- **WHEN** a session is expired, its token is wrong, its sequence conflicts, or gameplay time exceeds elapsed server time beyond tolerance
- **THEN** no state or score is accepted

### Requirement: Exactly-once finalization
The system SHALL atomically finalize each run at most once and support identical request retries.
#### Scenario: Lost response retry
- **WHEN** a committed checkpoint or finalization is retried identically
- **THEN** the prior result is returned without repeating its effects
#### Scenario: Competing finalization
- **WHEN** different finalizations target the same run version
- **THEN** at most one creates a score

### Requirement: Preserve playable controls and history
The system SHALL preserve keyboard, touch, pause/resume and local offline play, and retain older scores as explicitly unverified history.
#### Scenario: Temporary connection failure
- **WHEN** a checkpoint cannot be delivered
- **THEN** ordered events remain queued for bounded retry and a score is not falsely reported saved
#### Scenario: Legacy client submission
- **WHEN** an old client submits a raw score after cutover
- **THEN** the write is rejected and the player is told to reload
