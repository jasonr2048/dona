export interface InsertReturning {
    returning: (sel?: any) => Promise<any[]>;
}

export interface InsertBuilder {
    values: (rows: any | any[]) => InsertReturning;
}

export interface UpdateWhere {
    where: (cond: any) => Promise<any>;
}

export interface UpdateSet {
    set: (obj: any) => UpdateWhere;
}

export interface TxClient {
    insert: (table: any) => InsertBuilder;
    update: (table: any) => UpdateSet;
}

export interface DbClient extends TxClient {
    transaction: <T>(fn: (tx: TxClient) => Promise<T>) => Promise<T>;
    query: { [k: string]: any };
    [k: string]: any;
}
