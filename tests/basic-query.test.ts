import test from "ava"
import { NeonDialect } from "../src"
import { Kysely } from "kysely"

test("test query with neon", async (t) => {
  if (!process.env.NEON_DATABASE_URL) {
    t.fail("NEON_DATABASE_URL is not set")
  }

  const db = new Kysely<any>({
    dialect: new NeonDialect({
      connectionString: process.env.NEON_DATABASE_URL!,
    }),
  })

  // TODO come up with a schema to test this a bit more robustly and a local
  // dev setup
  const result = await db.selectFrom("account").selectAll().execute()
  console.log("waiting for result")

  t.truthy(result)
  t.truthy(result[0].email)
})
