# Auth email templates

Supabase sends the sign-up confirmation and password-reset emails from its
own templates, one per email, with no per-language choice. These are those
emails in Hebrew, English and Russian together (Hebrew first, right to
left), matching the app's three languages.

Nothing applies them automatically. To use them, in the Supabase dashboard
open **Authentication → Emails** and, for each template:

| Dashboard template | File                | Subject                                                          |
| ------------------ | ------------------- | ---------------------------------------------------------------- |
| Confirm signup     | `confirmation.html` | אישור הרשמה \| Confirm your sign-up \| Подтверждение регистрации |
| Reset password     | `recovery.html`     | איפוס סיסמה \| Reset your password \| Сброс пароля               |

paste the file's body (the comment at the top can stay or go) and the
subject, then save. Ask for a reset from `/reset-password-request` (with a test address) to check.

`{{ .ConfirmationURL }}` is Supabase's own placeholder; keep it as is.
