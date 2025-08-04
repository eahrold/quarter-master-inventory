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

### Fixed Bugs

- [x] Search Input Loses focus - Fixed in commit 540de60
- [x] Search Filters clobbered by text change - Fixed in commit 540de60

### Open Bugs

- [ ] Add New Item Modal is double nested and incorrectly sized - Modal contains unnecessary card wrapper causing layout issues
