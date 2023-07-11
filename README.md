# kysely-neon

[Kysely](https://github.com/koskimas/kysely) dialect for [Neon](https://neon.tech/) serverless postgres.

> Created with help from [kysely-d1](https://github.com/aidenwallis/kysely-d1) and the [neon serverless binding](https://github.com/neondatabase/serverless)

## Setup

Edge runtime:

```bash
npm i kysely-neon kysely @neondatabase/serverless
```

Node.js:

```bash
npm i kysely-neon kysely @neondatabase/serverless ws
```

## Usage

Edge runtime:

```typescript
import { GeneratedAlways, Kysely } from "kysely"
import { NeonDialect } from "kysely-neon"

interface Database {
  person: PersonTable
}

interface PersonTable {
  id: GeneratedAlways<number>
  first_name: string
  gender: "male" | "female" | "other"
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

Node.js:

```typescript
import { GeneratedAlways, Kysely } from "kysely"
import { NeonDialect } from "kysely-neon"
import ws from "ws"

interface Database {
  person: PersonTable
}

interface PersonTable {
  id: GeneratedAlways<number>
  first_name: string
  gender: "male" | "female" | "other"
}

const db = new Kysely<Database>({
  dialect: new NeonDialect({
    connectionString: process.env.DATABASE_URL,
    webSocketConstructor: ws,
  }),
})

await db
  .insertInto("person")
  .values({ first_name: "Jennifer", gender: "female" })
  .returning("id")
  .executeTakeFirstOrThrow()
```

Experimental HTTP Dialect:

`@neondatabase/serverless` has a new experimental `neon` function that allows making stateless HTTPS requests, 
that should have lower latancies, but no session or transaction support.

```typescript
import { GeneratedAlways, Kysely } from "kysely"
import { NeonHTTPDialect } from "kysely-neon"

interface Database {
  person: PersonTable
}

interface PersonTable {
  id: GeneratedAlways<number>
  first_name: string
  gender: "male" | "female" | "other"
}

const db = new Kysely<Database>({
  dialect: new NeonHTTPDialect({
    connectionString: process.env.DATABASE_URL,
  }),
})

await db
  .insertInto("person")
  .values({ first_name: "Jennifer", gender: "female" })
  .returning("id")
  .executeTakeFirstOrThrow()
```
