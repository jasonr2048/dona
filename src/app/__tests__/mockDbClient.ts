import type { DbClient } from "@/db/types";

/**
 * Test DB client factory.
 *
 * NOTE: `overrides` is intentionally typed as `any` so tests can pass jest.fn()
 * mocks directly without TypeScript trying to reconcile generated DB types,
 * which was causing the `never[]` / TS2345 errors.
 */
export function createMockDbClient(overrides?: any) {
  let convCounter = 1;
  let genericCounter = 1;
  const storage: Record<string, any[]> = {
    conversations: [],
    messages: [],
    messagesAudio: [],
    conversationParticipants: [],
    graphData: [],
    donations: []
  };

  const makeInsertBuilder = (tableName?: string) => {
    return {
      values(rows: any | any[]) {
        const arr = Array.isArray(rows) ? rows : [rows];
        const p: any = Promise.resolve(arr.map(() => undefined));
        p.returning = async (_sel?: any) => {
          const result = arr.map(() => {
            const id = tableName === "conversations" ? `conv-${convCounter++}` : `r-${genericCounter++}`;
            return { id };
          });
          if (tableName && storage[tableName]) {
            for (let i = 0; i < arr.length; i++) {
              const row = { ...arr[i], id: result[i].id };
              storage[tableName].push(row);
            }
          }
          return result;
        };
        return p as unknown as { returning: (sel?: any) => Promise<any[]> };
      }
    } as const;
  };

  const updateFn = (_table: any) => {
    return {
      set(_obj: any) {
        return {
          where: async (_cond: any) => Promise.resolve(undefined)
        };
      }
    };
  };

  const defaultQuery = {
    dataSources: {
      findMany: async (_opts?: any): Promise<any[]> => [{ id: "ds-default", name: "Default" }]
    },
    conversations: {
      findMany: async (_opts?: any): Promise<any[]> => []
    }
  };

  const baseClient: Partial<DbClient> = {
    insert(table: any) {
      const name = typeof table === "string" ? table : undefined;
      return makeInsertBuilder(name) as unknown as any;
    },

    update: updateFn,

    transaction: async function <T>(fn: (tx: { insert: (t: any) => any; update: any }) => Promise<T>) {
      const tx = {
        insert: (table: any) => {
          const name = typeof table === "string" ? table : undefined;
          return makeInsertBuilder(name);
        },
        update: updateFn
      };
      return fn(tx as any);
    },

    query: defaultQuery as any
  };

  // Allow overrides to replace any part of the client (including query).
  const client: DbClient = {
    ...(baseClient as any),
    ...(overrides || {})
  } as unknown as DbClient;

  return {
    client,
    storage
  } as const;
}
