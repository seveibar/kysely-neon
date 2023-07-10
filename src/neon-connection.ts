import { CompiledQuery, DatabaseConnection, QueryResult } from "kysely"

export interface Client {
  query: (sql: string, parameters: any[]) => Promise<any>
  release?: () => void
}

export const PRIVATE_RELEASE_METHOD = Symbol("release")

export class NeonConnection implements DatabaseConnection {
  readonly #client: Client

  constructor(client: Client) {
    this.#client = client
  }

  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    const result = await this.#client.query(compiledQuery.sql, [
      ...compiledQuery.parameters,
    ])

    if (
      result.command === "INSERT" ||
      result.command === "UPDATE" ||
      result.command === "DELETE"
    ) {
      const numAffectedRows = BigInt(result.rowCount)

      return {
        // TODO: remove.
        numUpdatedOrDeletedRows: numAffectedRows,
        numAffectedRows,
        rows: result.rows ?? [],
      }
    }

    return {
      rows: result.rows ?? [],
    }
  }

  async *streamQuery<O>(
    _compiledQuery: CompiledQuery,
    _chunkSize: number
  ): AsyncIterableIterator<QueryResult<O>> {
    throw new Error("Neon Driver does not support streaming")
  }

  [PRIVATE_RELEASE_METHOD](): void {
    this.#client.release?.()
  }
}
