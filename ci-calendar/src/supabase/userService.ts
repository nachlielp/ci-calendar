import { supabase } from "./client";
import { DbUser } from "../util/interfaces";

export const userService = {
    getUser,
    updateUser,
    createUser
}

async function getUser(id: string): Promise<DbUser | null> {
    const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

    if (error) {
        if (error.code === 'PGRST116') {
            console.log('No user found with id:', id);
            return null;
        }
        throw error;
    }
    return data;
}

async function updateUser(id: string, user: DbUser) {
    const { error } = await supabase
    .from('users')
    .update(user)
    .eq('id', id);

    if (error) {
        throw error;
    }
}

async function createUser(user: DbUser) {
    const { data, error } = await supabase
    .from('users')
    .insert(user);

    if (error) {
        throw error;
    }
    return data;
}