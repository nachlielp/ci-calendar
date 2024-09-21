import { supabase } from "./client";
import { CIEvent } from "../util/interfaces";

export interface FilterOptions {
    startDate?: string;
    endDate?: string;
    creatorId?: string;
    sortBy?: string;
    hideClosed?: boolean;
  }

export const cieventsService = {
  getCIEvents,
  createCIEvent,
  updateCIEvent,
  deleteCIEvent,
};

async function getCIEvents(
  filterBy: FilterOptions = {}
): Promise<CIEvent[]> {
  try {
    let query = supabase.from("ci-events").select("*");

    if (filterBy?.startDate) {
        query = query.gte("startDate",filterBy.startDate);
      }
    if (filterBy?.endDate) {
      query = query.lte("endDate", filterBy.endDate);
    }
    if (filterBy?.creatorId) {
      query = query.eq("creatorId", filterBy.creatorId);
    }
    if (filterBy?.sortBy) {
      query = query.order(filterBy.sortBy);
    }
    if (filterBy?.hideClosed) {
      query = query.eq("hide", false);
    }
    const { data, error } = await query;

    if (error) {
      throw error;
    }
    return data as CIEvent[];
  } catch (error) {
    console.error("Error fetching CI events:", error);
    throw error;
  }
}
async function createCIEvent(event: CIEvent): Promise<CIEvent> {
  const { data, error } = await supabase
    .from("ci-events")
    .insert(event)
    .select("*")
    .single();

  if (error) {
    throw error;
  }
  return data as CIEvent;
}

async function updateCIEvent(event: CIEvent): Promise<CIEvent> {
  const { data, error } = await supabase
    .from("ci-events")
    .update(event)
    .eq("id", event.id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }
  return data as CIEvent;
}

async function deleteCIEvent(id: string): Promise<void> {
  const { error } = await supabase
    .from("cievents")
    .delete()
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }
}
