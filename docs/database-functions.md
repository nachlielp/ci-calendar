# Database Functions Documentation

## check_user_is_admin

**Return Type**: boolean  
**Definition**:

```sql
CREATE OR REPLACE FUNCTION public.check_user_is_admin(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
 RETURN EXISTS (
 SELECT 1
 FROM user_roles ur
 JOIN roles r ON r.id = ur.role_id
 WHERE ur.user_id = user_id
 AND r.role = 'admin'
 );
END;
$function$
```

## has_admin_role

**Return Type**: boolean  
**Definition**:

```sql
CREATE OR REPLACE FUNCTION public.has_admin_role()
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
 is_admin boolean;
BEGIN
 SELECT EXISTS (
 SELECT 1
 FROM user_roles ur
 JOIN roles r ON r.id = ur.role_id
 WHERE ur.user_id = auth.uid() AND r.role = 'admin'
 ) INTO is_admin;

 RETURN is_admin;
END;
$function$
```

## has_creator_role

**Return Type**: boolean  
**Definition**:

```sql
CREATE OR REPLACE FUNCTION public.has_creator_role()
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
 has_permission BOOLEAN;
BEGIN
 SELECT EXISTS (
 SELECT 1
 FROM user_roles ur
 JOIN roles r ON r.id = ur.role_id
 WHERE ur.user_id = auth.uid() AND r.role IN ('admin', 'creator', 'org')
 ) INTO has_permission;

 RETURN has_permission;
END;
$function$
```

## has_profile_role

**Return Type**: boolean  
**Definition**:

```sql
CREATE OR REPLACE FUNCTION public.has_profile_role()
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
 has_permission BOOLEAN;
BEGIN
 SELECT EXISTS (
 SELECT 1
 FROM user_roles ur
 JOIN roles r ON r.id = ur.role_id
 WHERE ur.user_id = auth.uid() AND r.role IN ('admin', 'creator', 'org','profile')
 ) INTO has_permission;

 RETURN has_permission;
END;
$function$
```

## insert_user_role

**Return Type**: json  
**Definition**:

```sql
CREATE OR REPLACE FUNCTION public.insert_user_role(p_user_id_param uuid, p_role_id bigint)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
 result json;
BEGIN
 INSERT INTO public.user_roles (user_id, role_id)
 VALUES (p_user_id_param, p_role_id)
 RETURNING * INTO result;

 RETURN result;
END;
$function$
```

## set_short_id

**Return Type**: trigger  
**Definition**:

```sql
CREATE OR REPLACE FUNCTION public.set_short_id()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
 new_short_id TEXT;
BEGIN
 LOOP
 -- Generate a random 3-character alphanumeric ID
 new_short_id := (
 SELECT string_agg(
 CASE
 WHEN random() < 0.333 THEN chr(48 + trunc(random() * 10)::int) -- 0-9
 WHEN random() < 0.666 THEN chr(65 + trunc(random() * 26)::int) -- A-Z
 ELSE chr(97 + trunc(random() * 26)::int) -- a-z
 END, ''
 )
 FROM generate_series(1, 3)
 );

 -- Ensure the ID is unique
 IF NOT EXISTS (SELECT 1 FROM ci_events WHERE short_id = new_short_id) THEN
 NEW.short_id := new_short_id;
 RETURN NEW;
 END IF;
 END LOOP;
END;
$function$
```
