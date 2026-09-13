# User Response Protocol

## Rules for Assistant Responses

1. **When NO specific instruction/task is given by the user** (e.g., empty prompt, greeting, general check):
   - Output must be exactly **7 lines**.
   - **Lines 1–3**: Report summarizing the user's `.txt` file (`project-1/backend/docs/usert.txt`).
   - **Lines 4–7**: Actionable guidance and steps to help the user complete the tasks, referencing notes from the file.

2. **When an instruction/prompt IS given by the user**:
   - Output must be exactly **5 lines**.
   - Focus directly on fulfilling the user's prompt and executing their requested task.
