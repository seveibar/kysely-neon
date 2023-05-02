# kysely-neon

[Kysely](https://github.com/koskimas/kysely) adapter for [Neon](https://neon.tech/) serverless postgres.

```bash
npm i kysely-neon
```

> Created with help from [kysely-d1](https://github.com/aidenwallis/kysely-d1) and the [neon serverless binding](https://github.com/neondatabase/serverless)

## Usage

```typescript
interface Database {
  person: PersonTable
  pet: PetTable
  movie: MovieTable
}

const db = new Kysely<Database>({
  dialect: new NeonDialect({
    connectionString: process.env.DATABASE_URL,
  }),
})

await db
  .insertInto("person")
  .values({ first_name: "Jennifer", gender: "female" })
  .returning("id")
  .executeTakeFirstOrThrow()
```
