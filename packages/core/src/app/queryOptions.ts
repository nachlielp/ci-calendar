import type {
    DefaultError,
    InfiniteData,
    InfiniteQueryObserverOptions,
    OmitKeyof,
    QueryKey,
    QueryKeyWithDataTag,
    QueryObserverOptions,
} from "@tanstack/query-core"

// react-query's `queryOptions` and `infiniteQueryOptions`, for the core,
// which can't import React: the same identity functions, typed from
// query-core so the key carries its data type (`getQueryData(key)` is
// typed). What they return passes to each app's hooks (`useQuery`,
// `useInfiniteQuery`) and to the QueryClient as is. Only the overloads
// without `initialData`: nothing here sets it.

/** What `useQuery` takes (react-query's `UseQueryOptions`). */
export type CoreQueryOptions<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
> = OmitKeyof<
    QueryObserverOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>,
    "suspense"
>

/** What `useInfiniteQuery` takes (react-query's `UseInfiniteQueryOptions`). */
export type CoreInfiniteQueryOptions<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = InfiniteData<TQueryFnData>,
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = unknown,
> = OmitKeyof<
    InfiniteQueryObserverOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryKey,
        TPageParam
    >,
    "suspense"
>

export function queryOptions<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
>(
    options: CoreQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): CoreQueryOptions<TQueryFnData, TError, TData, TQueryKey> &
    QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError> {
    return options as CoreQueryOptions<TQueryFnData, TError, TData, TQueryKey> &
        QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>
}

export function infiniteQueryOptions<
    TQueryFnData,
    TError = DefaultError,
    TData = InfiniteData<TQueryFnData>,
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = unknown,
>(
    options: CoreInfiniteQueryOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryKey,
        TPageParam
    >,
): CoreInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
> &
    QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData>, TError> {
    return options as CoreInfiniteQueryOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryKey,
        TPageParam
    > &
        QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>
}
