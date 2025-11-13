import type { DbClient } from "@/db/types";

export function createMockDbClient(overrides?: Partial<DbClient>) {
  let convCounter = 1;
  let genericCounter = 1;
  const storage: Record<string, any[]> = {
    conversations: [],
    messages: [],
    messagesAudio: [],
    conversationParticipants: [],
    graphData: [],
    donations: [],
  };

  const makeInsertBuilder = (tableName?: string) => {
    return {
      values(rows: any | any[]) {
        const arr = Array.isArray(rows) ? rows : [rows];
        const p: any = Promise.resolve(arr.map(() => undefined));
        p.returning = async (_sel?: any) => {
          const result = arr.map(() => {
            const id =
              tableName === "conversations" ? `conv-${convCounter++}` : `r-${genericCounter++}`;
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
      },
    } as const;
  };

  const updateFn = (_table: any) => {
    return {
      set(_obj: any) {
        return {
          where: async (_cond: any) => Promise.resolve(undefined),
        };
      },
    };
  };

  const client: DbClient = {
    insert(table: any) {
      const name = typeof table === "string" ? table : undefined;
      return makeInsertBuilder(name) as unknown as any;
    },

    update: updateFn,

    transaction: async function <T>(
      fn: (tx: { insert: (t: any) => any; update: any }) => Promise<T>
    ) {
      const tx = {
        insert: (table: any) => {
          const name = typeof table === "string" ? table : undefined;
          return makeInsertBuilder(name);
        },
        update: updateFn,
      };
      return fn(tx as any);
    },

    query: {
      dataSources: {
        findMany: async () => [{ id: "ds-default", name: "Default" }],
      },
    },

    ...(overrides || {}),
  } as unknown as DbClient;

  return {
    client,
    storage,
  } as const;
}
