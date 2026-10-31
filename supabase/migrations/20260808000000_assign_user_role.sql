-- Atomic, admin-gated role assignment (ticket #16).
--
-- Before this migration the client performed the role change as three separate
-- writes (user_roles, users.user_type, public_bio) with no transaction, so a
-- failure between writes left a user half-promoted. It also relied on table
-- RLS to stop non-admins — which was never verified. This function makes the
-- whole change one atomic, server-enforced operation.
--
-- SECURITY DEFINER runs the body with the function owner's rights (bypassing
-- RLS on the three tables), so the admin check MUST be explicit here. auth.uid()
-- still reflects the *calling* user inside a definer function (it reads the
-- request JWT, not the definer), so has_admin_role() correctly gates the caller.
--
-- Apply to the live project (SQL editor / `supabase db push`) — this repo has no
-- automated migration runner wired up yet.

create or replace function public.assign_user_role(
    p_user_id uuid,
    p_role_id integer,
    p_user_type text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
    -- Only admins may change roles. RLS is bypassed inside SECURITY DEFINER, so
    -- this is the authorization boundary for the whole operation.
    if not public.has_admin_role() then
        raise exception 'not_authorized: only admins may assign roles'
            using errcode = '42501';
    end if;

    -- 1. role membership
    insert into public.user_roles (user_id, role_id)
    values (p_user_id, p_role_id)
    on conflict (user_id) do update set role_id = excluded.role_id;

    -- 2. denormalized user type on the account row
    update public.users
    set user_type = p_user_type
    where id = p_user_id;

    -- 3. denormalized user type on the public bio (created on demand)
    insert into public.public_bio (user_id, user_type)
    values (p_user_id, p_user_type)
    on conflict (user_id) do update set user_type = excluded.user_type;

    -- Return the assembled role (client expects the UserRole shape:
    -- user_id + role_id + user_type). user_type lives on users/public_bio, not
    -- user_roles, so build it from the inputs rather than the membership row.
    return json_build_object(
        'user_id', p_user_id,
        'role_id', p_role_id,
        'user_type', p_user_type
    );
end;
$$;

-- Reachable only by an authenticated session; the admin check above is the real
-- gate. Anon must never be able to call it.
revoke all on function public.assign_user_role(uuid, integer, text) from public, anon;
grant execute on function public.assign_user_role(uuid, integer, text) to authenticated;
