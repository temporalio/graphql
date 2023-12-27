*⚠️ This project is an alpha POC of a generic GraphQL API for Temporal. We welcome feedback and contributions.*

A GraphQL server that uses the [TypeScript SDK](https://docs.temporal.io/docs/typescript/introduction) to query Temporal Server. Built with [Apollo Server](https://www.apollographql.com/docs/apollo-server).

[Documentation site](https://temporal-graphql.netlify.app/)
- [Queries](https://temporal-graphql.netlify.app/#group-Operations-Queries)
- [Mutations](https://temporal-graphql.netlify.app/#group-Operations-Mutations)

## GraphQL projects

- This repo: A Node server that's able to decode Payloads (and encode arguments), but doesn't cover the entire Temporal API. Feel free to open PRs with more coverage. 
- [`temporalio/graphql-full`](https://github.com/temporalio/graphql-full): A Java GraphQL server that covers more gRPC methods but doesn't handle Payloads well.

## Get started

```
git clone https://github.com/temporalio/graphql.git
cd graphql
npm i
npm run start.watch
```

Open [localhost:4000](http://localhost:4000/) or point your GraphQL IDE (like [GraphQL Studio](https://studio.apollographql.com/sandbox/explorer)) at `http://localhost:4000/graphql`.

### Updating types

After you change [`src/schema.graphql`](src/schema.graphql), while your dev server is running (without errors), do:

```
npm run codegen
``` 

to update the types in [`src/generated-resolver-types.ts`](src/generated-resolver-types.ts).


