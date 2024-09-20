import { supabase } from "./client";
import { DbUser } from "../util/interfaces";

export const userService = {
    getUser,
    updateUser,
    createUser
}

async function getUser(id: string): Promise<DbUser | null> {
    try {
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
        return data as DbUser;
    } catch (error) {
        console.error('Error in getUser:', error);
        return null;
    }
}

async function updateUser(id: string, user: Partial<DbUser>): Promise<DbUser | null> {
    try {
        const { data, error } = await supabase
        .from('users')
        .update(user)
        .eq('id', id)
        .select()
        .single();

        if (error) {
            throw error;
        }
        console.log("Updated user data: ", data);
        return data as DbUser;
    } catch (error) {
        console.error('Error in updateUser:', error);
        return null;
    }
}

async function createUser(user: DbUser): Promise<DbUser | null> {
    try {
        const { data, error } = await supabase
        .from('users')
        .insert(user)
        .select()
        .single();

        if (error) {
            throw error;
        }
        return data as DbUser;
    } catch (error) {
        console.error('Error in createUser:', error);
        return null;
    }
}