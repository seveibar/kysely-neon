import {
  CompiledQuery,
  DatabaseConnection,
  DatabaseIntrospector,
  Dialect,
  Driver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  QueryCompiler,
  QueryResult,
  TransactionSettings,
} from "kysely"
import {
  ClientConfig,
  NeonConfig,
  Pool,
  PoolClient,
  neonConfig,
} from "@neondatabase/serverless"

type NeonDialectConfig = ClientConfig & Partial<NeonConfig>

const PRIVATE_RELEASE_METHOD = Symbol()

export class NeonDialect implements Dialect {
  readonly #config: NeonDialectConfig

  constructor(config: NeonDialectConfig) {
    this.#config = config
  }

  createAdapter() {
    return new PostgresAdapter()
  }

  createDriver(): Driver {
    return new NeonDriver(this.#config)
  }

  createQueryCompiler(): QueryCompiler {
    return new PostgresQueryCompiler()
  }

  createIntrospector(db: Kysely<any>): DatabaseIntrospector {
    return new PostgresIntrospector(db)
  }
}

class NeonDriver implements Driver {
  readonly #config: NeonDialectConfig
  readonly #connections = new WeakMap<PoolClient, DatabaseConnection>()
  #pool?: Pool

  constructor(config: NeonDialectConfig) {
    this.#config = config
  }

  async init(): Promise<void> {
    Object.assign(neonConfig, this.#config)
    this.#pool = new Pool(this.#config)
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    const client = await this.#pool!.connect()
    let connection = this.#connections.get(client)

    if (!connection) {
      connection = new NeonConnection(client)
      this.#connections.set(client, connection)
    }

    return connection
  }

  async beginTransaction(
    conn: NeonConnection,
    settings: TransactionSettings
  ): Promise<void> {
    if (settings.isolationLevel) {
      await conn.executeQuery(
        CompiledQuery.raw(
          `start transaction isolation level ${settings.isolationLevel}`
        )
      )
    } else {
      await conn.executeQuery(CompiledQuery.raw("begin"))
    }
  }

  async commitTransaction(conn: NeonConnection): Promise<void> {
    await conn.executeQuery(CompiledQuery.raw("commit"))
  }

  async rollbackTransaction(conn: NeonConnection): Promise<void> {
    await conn.executeQuery(CompiledQuery.raw("rollback"))
  }

  async releaseConnection(connection: NeonConnection): Promise<void> {
    connection[PRIVATE_RELEASE_METHOD]()
  }

  async destroy(): Promise<void> {
    if (this.#pool) {
      const pool = this.#pool
      this.#pool = undefined
      await pool.end()
    }
  }
}

class NeonConnection implements DatabaseConnection {
  readonly #client: PoolClient

  constructor(client: PoolClient) {
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
    this.#client.release()
  }
}
