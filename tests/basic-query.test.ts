import test from "ava"
import { Generated, Kysely } from "kysely"
import ws from "ws"
import { NeonDialect, NeonHTTPDialect } from "../src"
import { neon } from "@neondatabase/serverless"

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

test.beforeEach(async () => {
  await neon(connectionString)`CREATE TABLE IF NOT EXISTS kysely_neon_test (
    id SERIAL PRIMARY KEY,
    email VARCHAR
  )`
})

test.afterEach(async () => {
  await neon(connectionString)`DROP TABLE IF EXISTS kysely_neon_test`
})

for (const ctx of contexts) {
  test.serial(ctx.name, async (t) => {
    const db = new Kysely<{
      kysely_neon_test: { id: Generated<number>; email: string }
    }>({
      dialect: ctx.dialect,
    })

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
