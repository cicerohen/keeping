---
description: CRUD Verification Workflow
---

# CRUD Verification Workflow

1. **Setup:** Run `npm run dev` in the terminal and open the browser to `http://localhost:5174`.
2. **Auth Flow:** - Logout (if a session exists).
   - Login using the credentials defined in `.env.test`.
3. **Data Integrity (CRUD):**
   - Create a task named "Automated Test Task".
   - Edit that same task to change the title to "Updated Task".
   - Delete the "Updated Task".
4. **Validation:** Verify the task list is empty and no "Delete" errors appear in the console.
5. **Report:** Provide a screenshot of the final empty state.
