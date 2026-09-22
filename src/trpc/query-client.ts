import {
  defaultShouldDehydrateQuery,
  QueryClient,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import SuperJSON from "superjson";
import { useAuthStore } from "~/lib/stores/auth.store";
import { TRPCClientError } from "@trpc/client";

function handleUnauthorizedError(error: Error) {
  // Check if it's a tRPC error with UNAUTHORIZED code
  if (error instanceof TRPCClientError) {
    const trpcError = error as TRPCClientError<any>;
    if (trpcError.data?.code === "UNAUTHORIZED") {
      // Clear auth state
      useAuthStore.getState().clearAuth();
      
      // Redirect to login if not already there
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
  }
}

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000,
      },
      dehydrate: {
        serializeData: SuperJSON.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
    },
    queryCache: new QueryCache({
      onError: (error) => {
        handleUnauthorizedError(error);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        handleUnauthorizedError(error);
      },
    }),
  });

let clientQueryClientSingleton: QueryClient | undefined = undefined;

export const getQueryClient = () => {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return createQueryClient();
  }
  // Browser: use singleton pattern to keep the same query client
  return (clientQueryClientSingleton ??= createQueryClient());
};
