# **FutureLens To-Do Checklist**

## **MVP: Core Tasks**

### **1\. Project & Supabase Setup**

* **Repository & Init**

  * ✅ Create a Git repository

  * ✅ Initialise the project structure (`index.html`, `src/`, etc.)

  * ✅ Install baseline dependencies (e.g. `jest` if needed)

  * ✅ Add a sample test to ensure environment is working

* **Supabase Client**

  * ✅ Install `@supabase/supabase-js`

  * ✅ Create a `main.js` or `app.js` that initialises the Supabase client with your URL and key

  * ✅ Test the connection by calling `supabase.auth.getSession()` (mock or real)

### **2\. Database Schema & Row-Level Security**

* **Create Tables** in Supabase (via SQL or migration script):

  * `participants(id, passcode unique, cohort_id, survey_id, inserted_at)`

  * `responses(id, participant_id, question_key, likert_value, dont_understand, inserted_at)`

  * `surveys(id, json_config, inserted_at)`

  * `cohorts(id, code, label, inserted_at)`

* **Enable RLS**

  * Turn on Row-Level Security for `participants` and `responses`

  * Write policies so users can only select/insert/update their own rows

* **Test Schema**

  * Confirm tables exist

  * Confirm policies behave as expected (e.g. user cannot see others' rows)

### **3\. Basic Auth & Passcode Verification**

* **Login Form** in `index.html`

  * Field for passcode/survey code

  * A "Submit"/"Login" button

* **`auth.js`**

  * `handleLogin(passcode)`

    * Normalise case

    * Query Supabase (`participants`) to find matching passcode

    * Store `participant_id` (or relevant user data) in state or `localStorage` if found

    * Return success/failure

* **Login Tests**

  * Mock supabase calls

  * Ensure correct passcodes succeed, incorrect fail

  * Check error messages or logging

### **4\. Survey Loading & Question Display**

* **`survey.js`** (or similar)

  * `fetchSurvey(surveyId)`: retrieve JSON config from `surveys` table

  * `initSurvey(surveyJson)`: separate or parse question config

    * Shuffle required questions

    * Store question order in `localStorage`

* **Render**

  * `displayQuestion(question)`: show text, Likert scale, "I Don't Understand" checkbox

  * "Next" / "Back" buttons (optional immediate or iterative approach)

* **Survey Tests**

  * Mock `fetchSurvey`

  * Ensure questions display in random order and remain consistent on page refresh

### **5\. Answer Submission & Offline Sync**

* **Local Submission**

  * `recordAnswer(questionId, likertValue, dontUnderstand)`: writes data to an offline queue in `localStorage`

* **Sync Logic**

  * `syncResponses()`: pushes offline queue to Supabase whenever online

  * Network status detection (online/offline events or manual checks)

* **Testing Offline**

  * Simulate offline, fill a few answers

  * Reconnect, ensure they sync automatically

  * Confirm no data loss or duplication

### **6\. Required vs. Optional Questions**

* **Survey Structure**

  * In your JSON config, mark questions as `required: true` or `false`

  * Show required set first

  * On completion of required questions, show results and/or unlock optional set

* **Saving Optional**

  * "Save Now" button for partial optional answers

  * Sync partial data if user leaves partway

* **Testing**

  * Confirm required must be completed before results

  * Confirm partial optional answers are saved

  * Return to optional questions later, pick up from saved place

### **7\. Results Page & Scoring**

* **`results.js`** or a module

  * `calculateScores(participantId)`: fetch user's responses from Supabase, compute average

  * Handle positive/negative alignment (if needed)

  * Display summary of continuum scores

* **Minimal Group Comparison (Placeholder)**

  * A stub that either shows "Compare with My Group" is coming soon

  * OR fetch basic group average from `responses` by cohort

* **Tests**

  * Insert known data → check scoring logic

  * Confirm partial optional answers affect average as intended

### **8\. Session Timeout & Refresh**

* **Session Timer**

  * Track inactivity up to 60 minutes, force re-login on expiry

  * If user is active (clicks, keystrokes), call `supabase.auth.getSession()` to refresh

* **Implementation**

  * Possibly in `auth.js` or a separate `session.js`

  * Show a logout prompt or auto-redirect to the login page on timeout

* **Tests**

  * Mock inactivity → verify forced logout

  * Mock activity → verify refresh tokens keep session going

### **9\. Final Polishing & Testing**

* **Code Review**

  * Remove unused code or commented-out parts

  * Final pass over HTML/CSS for responsiveness

* **Comprehensive Tests**

  * RLS checks (cannot see other participants' data)

  * Offline → Online transitions

  * Required vs. optional flow

  * Passcode uniqueness or collisions

  * Session inactivity

* **Deployment**

  * Prepare for Hostinger or any static hosting

  * Configure environment variables for Supabase (URL, anon key)

  * Verify everything works in staging/production environment

---

## **Post-MVP Features**

Use these as a roadmap for future enhancements. You can re-order or prioritise based on your needs.

1. **Admin Panel (`/admin`)**

   * Restrict by admin role

   * View cohort-level insights (averages, standard deviation, total responses)

   * Extend RLS policies or separate access rules

2. **Detailed Group Comparison**

   * More refined summary: outlier warnings, distribution charts

   * Compare user's score vs. cohort average

3. **Reflection Prompts**

   * Free-text fields on results page

   * Store data in `responses` or a separate `reflections` table

4. **Teacher-Facing Dashboard**

   * Distribution graphs, dot plots, histograms

   * Cohort filter, timeline of submissions

5. **Role-Based Access**

   * Distinguish "admin" vs. "teacher"

   * Limit teachers to their own cohorts

6. **Printable/PDF Results**

   * "Print or Save as PDF" button

   * Minimal styling that fits one page

7. **Gamified Completion Badges**

   * Award badges for finishing all optional questions

   * Track user progress in a simple achievements table

8. **Multi-Language Support**

   * Abstract all text into JSON or resource files

   * Provide a mechanism to choose language

9. **CSV Upload of Participants & Cohorts**

   * Bulk passcode generation

   * Automated collision checks

10. **Cohort Expiry Management**

    * Mark cohorts inactive/expired to block new submissions

    * Archive older data

11. **Analytics Dashboard**

    * More advanced usage metrics (completion rates, device breakdown)

12. **Cross-Cohort Comparison Tool**

    * Compare multiple cohorts side by side

    * Possibly advanced permission checks

---

## **Usage**

1. **Work Iteratively** through each MVP chunk.

2. **Tick off** items when completed & tested.

3. **Proceed** to Post-MVP features only after a stable MVP release.

---

This **`todo.md`** should keep your development structured and on track. Feel free to add, remove, or refine items as the project evolves. Happy building\!

