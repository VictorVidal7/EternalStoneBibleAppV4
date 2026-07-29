/**
 * Minimal ambient typing for sql.js's asm.js build (see the file-level doc
 * comment in insertVersesBatchedSql.test.ts for why this specific build is
 * used). The published package ships no TypeScript declarations, and no
 * `@types/sql.js` package is added — that would be a second new dependency
 * for what is, at the call sites in that test file, a handful of methods.
 * Covers exactly the API surface used there.
 *
 * This has to live in its own `.d.ts` file rather than a `declare module`
 * block inside the `.ts` test file itself: TypeScript resolves
 * `sql.js/dist/sql-asm.js` to a real file on disk (the package's `exports`
 * map allows the deep import), so a same-named `declare module` block
 * inside a regular `.ts` file is treated as an "augmentation" of that
 * already-resolved (implicitly-`any`) module, which TS rejects (TS2665).
 * Declaring it here instead, in a `.d.ts` file, is exactly what TS's own
 * TS7016 error message suggests.
 */
declare module 'sql.js/dist/sql-asm.js' {
  export interface SqlJsQueryExecResult {
    columns: string[];
    values: (string | number | Uint8Array | null)[][];
  }

  export interface SqlJsStatement {
    bind(params?: (string | number | null)[]): boolean;
    step(): boolean;
    getAsObject(): Record<string, string | number | Uint8Array | null>;
    free(): boolean;
  }

  export interface SqlJsDatabase {
    run(sql: string, params?: (string | number | null)[]): SqlJsDatabase;
    exec(
      sql: string,
      params?: (string | number | null)[],
    ): SqlJsQueryExecResult[];
    prepare(sql: string): SqlJsStatement;
    getRowsModified(): number;
  }

  export interface SqlJsStaticApi {
    Database: new (data?: Uint8Array) => SqlJsDatabase;
  }

  export default function initSqlJs(config?: unknown): Promise<SqlJsStaticApi>;
}
