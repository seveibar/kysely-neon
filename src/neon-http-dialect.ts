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
import { NeonQueryFunction, neon } from "@neondatabase/serverless"
import { NeonConnection } from "neon-connection"

interface NeonHTTPDialectConfig {
  connectionString: string
}

export class NeonHTTPDialect implements Dialect {
  readonly #config: NeonHTTPDialectConfig

  constructor(config: NeonHTTPDialectConfig) {
    this.#config = config
  }

  createAdapter() {
    return new PostgresAdapter()
  }

  createDriver(): Driver {
    return new NeonHTTPDriver(this.#config)
  }

  createQueryCompiler(): QueryCompiler {
    return new PostgresQueryCompiler()
  }

  createIntrospector(db: Kysely<any>): DatabaseIntrospector {
    return new PostgresIntrospector(db)
  }
}

class NeonHTTPDriver implements Driver {
  readonly #config: NeonHTTPDialectConfig
  readonly #connection: NeonConnection

  constructor(config: NeonHTTPDialectConfig) {
    this.#config = config
    this.#connection = new NeonConnection({
      query: neon(this.#config.connectionString, { fullResults: true }),
    })
  }

  async init(): Promise<void> {
    // noop
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    return this.#connection
  }

  async beginTransaction(
    _: DatabaseConnection,
    __: TransactionSettings
  ): Promise<void> {
    throw new Error("Transactions are not supported with Neon HTTP connections")
  }

  async commitTransaction(_: DatabaseConnection): Promise<void> {
    throw new Error("Transactions are not supported with Neon HTTP connections")
  }

  async rollbackTransaction(_: DatabaseConnection): Promise<void> {
    throw new Error("Transactions are not supported with Neon HTTP connections")
  }

  async releaseConnection(_: DatabaseConnection): Promise<void> {
    // noop
  }

  async destroy(): Promise<void> {
    // noop
  }
}
