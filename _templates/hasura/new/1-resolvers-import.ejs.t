---
inject: true
prepend: true
skip_if: import .+ from '\./<%= name %>'
to: src/generated/hasura/resolvers/index.ts
---
import { Query as <%= h.changeCase.pascal(name) %>Query } from './<%= name %>';