# Bug Tracking and Fixes

This file tracks bugs found during development and their resolution status.

## How to use this file

### 1. When a new bug is discovered:

- Add a new entry with `- [ ]` (unchecked checkbox)
- Include a clear, descriptive title
- Add any relevant details or context
- Format: `- [ ] Bug description - [Context or reproduction steps]`

### 2. When a bug is fixed:

- Change `- [ ]` to `- [x]` (checked checkbox)
- Add the commit SHA that fixed the bug
- Format: `- [x] Bug description - Fixed in commit [SHA]`

### 3. Example format:

```markdown
- [ ] Login form validation error - Password field accepts empty strings
- [x] Search Input Loses focus - Fixed in commit abc1234
- [x] Search Filters clobbered by text change - Fixed in commit def5678
```

## Current Bug Status

### Open Bugs

(No open bugs at this time)

### Recently Fixed Bugs

- [x] Search Input Loses focus - Fixed in commit 540de60
- [x] Search Filters clobbered by text change - Fixed in commit 540de60
- [x] Add New Item Modal is double nested and incorrectly sized - Fixed in commit 2953b52
- [x] "View Details" button in item cards not working - Fixed by implementing navigation to item detail page
- [x] Unable to open Edit modal for users in the UI - Fixed in commit 274e99a
- [x] Add User button not working - Fixed in commit 274e99a
