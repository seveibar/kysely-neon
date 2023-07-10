import test from "ava"
import { Generated, Kysely, sql } from "kysely"
import ws from "ws"
import { NeonDialect, NeonHTTPDialect } from "../src"

const connectionString = process.env.NEON_DATABASE_URL!

const contexts = [
  {
    dialect: new NeonDialect({ connectionString, webSocketConstructor: ws }),
    name: NeonDialect.name,
    supportsTransactions: true,
  },
  {
    dialect: new NeonHTTPDialect({ connectionString }),
    name: NeonHTTPDialect.name,
    supportsTransactions: false,
  },
] as const

for (const ctx of contexts) {
  test(ctx.name, async (t) => {
    const db = new Kysely<{
      kysely_neon_test: { id: Generated<number>; email: string }
    }>({
      dialect: ctx.dialect,
    })

    await db.schema.dropTable("kysely_neon_test").ifExists().execute()

    await db.schema
      .createTable("kysely_neon_test")
      .ifNotExists()
      .addColumn("id", "serial", (col) => col.primaryKey())
      .addColumn("email", "varchar")
      .execute()

    await db
      .insertInto("kysely_neon_test")
      .values({ email: "info@example.com" })
      .execute()

    if (ctx.supportsTransactions) {
      await db.transaction().execute(async (trx) => {
        await trx
          .insertInto("kysely_neon_test")
          .values({ email: "info@example.com" })
          .execute()

        await trx
          .insertInto("kysely_neon_test")
          .values({ email: "info@example.com" })
          .execute()
      })
    }

    const result = await db.selectFrom("kysely_neon_test").selectAll().execute()

    t.truthy(result)
    t.truthy(result[0].email)
  })
}
