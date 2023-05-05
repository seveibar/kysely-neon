import test from "ava"
import { Kysely } from "kysely"
import ws from "ws"
import { NeonDialect } from "../src"

test("test query with neon", async (t) => {
  const db = new Kysely<{ kysely_neon_test: { id: string; email: string } }>({
    dialect: new NeonDialect({
      connectionString: process.env.NEON_DATABASE_URL,
      webSocketConstructor: ws,
    }),
  })

  await db.schema.dropTable("kysely_neon_test").ifExists().execute()

  await db.schema
    .createTable("kysely_neon_test")
    .addColumn("id", "varchar", (col) => col.primaryKey())
    .addColumn("email", "varchar")
    .execute()

  await db
    .insertInto("kysely_neon_test")
    .values({ id: "123", email: "info@example.com" })
    .execute()

  const result = await db.selectFrom("kysely_neon_test").selectAll().execute()

  t.truthy(result)
  t.truthy(result[0].email)
})
