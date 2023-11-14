---
inject: true
after: export const Query = {
skip_if: <%= h.changeCase.pascal(name) %>Query\,
to: src/generated/hasura/resolvers/index.ts
---
  ...<%= h.changeCase.pascal(name) %>Query,