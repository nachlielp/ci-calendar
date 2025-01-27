# Database Schema

## Tables

### alerts

| Column      | Type    | Constraints |
| ----------- | ------- | ----------- |
| title       | text    |             |
| id          | uuid    | NOT NULL    |
| type        | text    |             |
| ci_event_id | uuid    |             |
| user_id     | uuid    |             |
| request_id  | uuid    |             |
| viewed      | boolean |             |

```
CREATE TABLE alerts (title text, id uuid NOT NULL, type text, ci_event_id uuid, user_id uuid, request_id uuid, viewed boolean);
```

```sql
ALTER TABLE alerts ADD CONSTRAINT alerts_user_id_fkey FOREIGN KEY (2) REFERENCES users (1);
ALTER TABLE alerts ADD CONSTRAINT alerts_request_id_fkey FOREIGN KEY (6) REFERENCES requests (13);
ALTER TABLE alerts ADD CONSTRAINT alerts_ci_event_id_fkey FOREIGN KEY (3) REFERENCES ci_events (1);
```

### ci_events

| Column             | Type                     | Constraints |
| ------------------ | ------------------------ | ----------- |
| id                 | uuid                     | NOT NULL    |
| short_id           | text                     |             |
| cancelled_text     | text                     |             |
| description        | text                     | NOT NULL    |
| title              | text                     | NOT NULL    |
| type               | text                     | NOT NULL    |
| district           | text                     | NOT NULL    |
| address            | json                     | NOT NULL    |
| updated_at         | timestamp with time zone |             |
| owners             | ARRAY                    | NOT NULL    |
| hide               | boolean                  | NOT NULL    |
| price              | ARRAY                    | NOT NULL    |
| links              | ARRAY                    | NOT NULL    |
| segments           | ARRAY                    | NOT NULL    |
| user_id            | uuid                     |             |
| start_date         | date                     |             |
| end_date           | date                     |             |
| source_template_id | uuid                     |             |
| is_multi_day       | boolean                  |             |
| multi_day_teachers | ARRAY                    |             |
| is_notified        | boolean                  |             |
| organisations      | ARRAY                    | NOT NULL    |
| cancelled          | boolean                  |             |
| recurring_ref_key  | uuid                     |             |
| created_at         | timestamp with time zone | NOT NULL    |

```
CREATE TABLE ci_events (id uuid NOT NULL, short_id text, cancelled_text text, description text NOT NULL, title text NOT NULL, type text NOT NULL, district text NOT NULL, address json NOT NULL, updated_at timestamp with time zone, owners ARRAY NOT NULL, hide boolean NOT NULL, price ARRAY NOT NULL, links ARRAY NOT NULL, segments ARRAY NOT NULL, user_id uuid, start_date date, end_date date, source_template_id uuid, is_multi_day boolean, multi_day_teachers ARRAY, is_notified boolean, organisations ARRAY NOT NULL, cancelled boolean, recurring_ref_key uuid, created_at timestamp with time zone NOT NULL);
```

```sql
ALTER TABLE ci_events ADD CONSTRAINT ci-events_source_template_id_fkey FOREIGN KEY (19) REFERENCES templates (1);
ALTER TABLE ci_events ADD CONSTRAINT ci_events_user_id_fkey FOREIGN KEY (15) REFERENCES users (1);
```

### ci_events_users_junction

| Column      | Type                     | Constraints |
| ----------- | ------------------------ | ----------- |
| user_id     | uuid                     | NOT NULL    |
| created_at  | timestamp with time zone | NOT NULL    |
| id          | uuid                     | NOT NULL    |
| ci_event_id | uuid                     | NOT NULL    |

```
CREATE TABLE ci_events_users_junction (user_id uuid NOT NULL, created_at timestamp with time zone NOT NULL, id uuid NOT NULL, ci_event_id uuid NOT NULL);
```

```sql
ALTER TABLE ci_events_users_junction ADD CONSTRAINT ci_events_users_junction_ci_event_id_fkey FOREIGN KEY (4) REFERENCES ci_events (1);
ALTER TABLE ci_events_users_junction ADD CONSTRAINT ci_events_users_junction_user_id_fkey FOREIGN KEY (3) REFERENCES public_bio (3);
```

### config

| Column     | Type                     | Constraints |
| ---------- | ------------------------ | ----------- |
| update_by  | uuid                     |             |
| flag       | boolean                  | NOT NULL    |
| title      | text                     |             |
| data       | text                     |             |
| id         | bigint                   | NOT NULL    |
| created_at | timestamp with time zone | NOT NULL    |

```
CREATE TABLE config (update_by uuid, flag boolean NOT NULL, title text, data text, id bigint NOT NULL, created_at timestamp with time zone NOT NULL);
```

```sql
ALTER TABLE config ADD CONSTRAINT config_update_by_fkey FOREIGN KEY (5) REFERENCES users (1);
```

### notifications

| Column          | Type                     | Constraints |
| --------------- | ------------------------ | ----------- |
| id              | uuid                     | NOT NULL    |
| created_at      | timestamp with time zone | NOT NULL    |
| user_id         | uuid                     |             |
| ci_event_id     | uuid                     |             |
| sent            | boolean                  | NOT NULL    |
| type            | text                     |             |
| remind_in_hours | text                     |             |

```
CREATE TABLE notifications (id uuid NOT NULL, created_at timestamp with time zone NOT NULL, user_id uuid, ci_event_id uuid, sent boolean NOT NULL, type text, remind_in_hours text);
```

```sql
ALTER TABLE notifications ADD CONSTRAINT notifications_ci_event_id_fkey FOREIGN KEY (4) REFERENCES ci_events (1);
ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (3) REFERENCES users (1);
```

### public_bio

| Column        | Type                     | Constraints |
| ------------- | ------------------------ | ----------- |
| about         | text                     |             |
| page_url      | text                     |             |
| page_title    | text                     |             |
| user_type     | text                     |             |
| bio_name      | text                     | NOT NULL    |
| img           | text                     |             |
| page_url_2    | text                     |             |
| page_title_2  | text                     |             |
| id            | uuid                     | NOT NULL    |
| created_at    | timestamp with time zone | NOT NULL    |
| user_id       | uuid                     | NOT NULL    |
| show_profile  | boolean                  |             |
| allow_tagging | boolean                  |             |

```
CREATE TABLE public_bio (about text, page_url text, page_title text, user_type text, bio_name text NOT NULL, img text, page_url_2 text, page_title_2 text, id uuid NOT NULL, created_at timestamp with time zone NOT NULL, user_id uuid NOT NULL, show_profile boolean, allow_tagging boolean);
```

```sql
ALTER TABLE public_bio ADD CONSTRAINT public_bio_user_id_fkey FOREIGN KEY (3) REFERENCES users (1);
```

### requests

| Column          | Type                     | Constraints |
| --------------- | ------------------------ | ----------- |
| user_id         | uuid                     |             |
| created_at      | timestamp with time zone | NOT NULL    |
| responses       | ARRAY                    | NOT NULL    |
| viewed_by       | ARRAY                    |             |
| viewed_response | boolean                  |             |
| id              | uuid                     | NOT NULL    |
| number          | bigint                   | NOT NULL    |
| sent            | boolean                  |             |
| viewed          | boolean                  |             |
| to_send         | boolean                  |             |
| closed          | boolean                  |             |
| admins_notified | boolean                  |             |
| type            | text                     |             |
| message         | text                     |             |
| status          | text                     |             |
| phone           | text                     |             |
| email           | text                     |             |
| name            | text                     |             |

```
CREATE TABLE requests (user_id uuid, created_at timestamp with time zone NOT NULL, responses ARRAY NOT NULL, viewed_by ARRAY, viewed_response boolean, id uuid NOT NULL, number bigint NOT NULL, sent boolean, viewed boolean, to_send boolean, closed boolean, admins_notified boolean, type text, message text, status text, phone text, email text, name text);
```

```sql
ALTER TABLE requests ADD CONSTRAINT requests_user_id_fkey FOREIGN KEY (3) REFERENCES users (1);
```

### roles

| Column | Type   | Constraints |
| ------ | ------ | ----------- |
| role   | text   |             |
| id     | bigint | NOT NULL    |

```
CREATE TABLE roles (role text, id bigint NOT NULL);
```

### templates

| Column             | Type                     | Constraints |
| ------------------ | ------------------------ | ----------- |
| title              | text                     |             |
| description        | text                     |             |
| created_at         | timestamp with time zone | NOT NULL    |
| address            | json                     |             |
| id                 | uuid                     | NOT NULL    |
| district           | text                     |             |
| type               | text                     |             |
| user_id            | uuid                     |             |
| name               | text                     |             |
| price              | ARRAY                    |             |
| owners             | ARRAY                    |             |
| is_multi_day       | boolean                  |             |
| updated_at         | date                     |             |
| segments           | ARRAY                    |             |
| links              | ARRAY                    |             |
| organisations      | ARRAY                    | NOT NULL    |
| multi_day_teachers | ARRAY                    |             |

```
CREATE TABLE templates (title text, description text, created_at timestamp with time zone NOT NULL, address json, id uuid NOT NULL, district text, type text, user_id uuid, name text, price ARRAY, owners ARRAY, is_multi_day boolean, updated_at date, segments ARRAY, links ARRAY, organisations ARRAY NOT NULL, multi_day_teachers ARRAY);
```

```sql
ALTER TABLE templates ADD CONSTRAINT templates_user_id_fkey FOREIGN KEY (3) REFERENCES users (1);
```

### user_roles

| Column     | Type                     | Constraints |
| ---------- | ------------------------ | ----------- |
| created_at | timestamp with time zone | NOT NULL    |
| id         | uuid                     | NOT NULL    |
| user_id    | uuid                     | NOT NULL    |
| role_id    | bigint                   |             |

```
CREATE TABLE user_roles (created_at timestamp with time zone NOT NULL, id uuid NOT NULL, user_id uuid NOT NULL, role_id bigint);
```

```sql
ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (4) REFERENCES roles (1);
ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (3) REFERENCES users (1);
```

### users

| Column                    | Type                     | Constraints |
| ------------------------- | ------------------------ | ----------- |
| is_internal               | boolean                  |             |
| created_at                | timestamp with time zone | NOT NULL    |
| id                        | uuid                     | NOT NULL    |
| user_type                 | text                     | NOT NULL    |
| user_name                 | text                     | NOT NULL    |
| phone                     | text                     | NOT NULL    |
| email                     | text                     | NOT NULL    |
| provider                  | text                     |             |
| version                   | text                     |             |
| fcm_token                 | text                     |             |
| pwa_install_id            | text                     |             |
| subscribed_for_updates_at | timestamp with time zone |             |
| push_notification_tokens  | ARRAY                    | NOT NULL    |
| subscriptions             | jsonb                    |             |
| receive_notifications     | boolean                  | NOT NULL    |
| last_signin               | date                     |             |
| updated_at                | timestamp with time zone |             |

```
CREATE TABLE users (is_internal boolean, created_at timestamp with time zone NOT NULL, id uuid NOT NULL, user_type text NOT NULL, user_name text NOT NULL, phone text NOT NULL, email text NOT NULL, provider text, version text, fcm_token text, pwa_install_id text, subscribed_for_updates_at timestamp with time zone, push_notification_tokens ARRAY NOT NULL, subscriptions jsonb, receive_notifications boolean NOT NULL, last_signin date, updated_at timestamp with time zone);
```

### Foreign Keys

The following foreign key constraints belong to tables outside the main schema (auth, storage, etc.):

```sql
ALTER TABLE storage.objects ADD CONSTRAINT objects_bucketId_fkey FOREIGN KEY (2) REFERENCES storage.buckets (1);
ALTER TABLE pgsodium.key ADD CONSTRAINT key_parent_key_fkey FOREIGN KEY (12) REFERENCES pgsodium.key (1);
ALTER TABLE vault.secrets ADD CONSTRAINT secrets_key_id_fkey FOREIGN KEY (5) REFERENCES pgsodium.key (1);
ALTER TABLE auth.identities ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (2) REFERENCES auth.users (2);
ALTER TABLE auth.sessions ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (2) REFERENCES auth.users (2);
ALTER TABLE auth.refresh_tokens ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (9) REFERENCES auth.sessions (1);
ALTER TABLE auth.mfa_factors ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (2) REFERENCES auth.users (2);
ALTER TABLE auth.mfa_challenges ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (2) REFERENCES auth.mfa_factors (1);
ALTER TABLE auth.mfa_amr_claims ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (1) REFERENCES auth.sessions (1);
ALTER TABLE auth.one_time_tokens ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (2) REFERENCES auth.users (2);
ALTER TABLE storage.s3_multipart_uploads_parts ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (2) REFERENCES storage.s3_multipart_uploads (1);
ALTER TABLE storage.s3_multipart_uploads_parts ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (5) REFERENCES storage.buckets (1);
ALTER TABLE auth.sso_domains ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (2) REFERENCES auth.sso_providers (1);
ALTER TABLE auth.saml_providers ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (2) REFERENCES auth.sso_providers (1);
ALTER TABLE auth.saml_relay_states ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (2) REFERENCES auth.sso_providers (1);
ALTER TABLE auth.saml_relay_states ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (9) REFERENCES auth.flow_state (1);
ALTER TABLE storage.s3_multipart_uploads ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (4) REFERENCES storage.buckets (1);
```
