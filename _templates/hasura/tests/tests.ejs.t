---
to: tests/controllers/<%= name %>.test.ts
---
<% const generationResolvers = resolvers.split(','); %>
import fetch from 'cross-fetch';
import * as fs from 'fs';

import { Prisma, PrismaClient } from '../../src/types/generated/prisma';
import { initDb } from '../../src/utils/init-db';
import { <%= h.changeCase.pascal(name) %> } from '../../src/types';

import <%= h.changeCase.pascal(name) %>CreateManyInput = Prisma.<%= h.changeCase.pascal(name) %>CreateManyInput;

let db: PrismaClient;

const MOCK_DB_PAYLOAD: <%= h.changeCase.pascal(name) %>CreateManyInput[] = [
  {
    id: 'b7f09cc6-9f4d-41fc-9152-2aa061e712f9',
    name: 'Test',
  },
  {
    id: '7a66ddf6-0c72-4f97-88e0-7f7254ff58a1',
    name: 'Rest',
  },
  {
    id: '3a532f0b-5514-4a5b-bd02-d9b10afa33a9',
    name: 'West',
  },
];

beforeEach(async () => {
  db = await initDb();
  await db.<%= prismaInstance %>.deleteMany();
  await db.<%= prismaInstance %>.createMany({
    data: MOCK_DB_PAYLOAD,
  });
});

afterEach(async () => {
  await db.$disconnect();
});

<% if (generationResolvers.includes('select')) { %>
describe('<%= h.changeCase.camel(name) %>', () => {
  it('should returns all <%= h.changeCase.camel(name) %>s if args not provided', async () => {
    const JWT_TOKEN = fs
      .readFileSync('./tests/keys/valid.access.jwt', 'utf8')
      .trim();

    const <%= h.changeCase.upper(h.changeCase.snake(name)) %>_QUERY = `
      #graphql
      {
        <%= h.changeCase.camel(name) %> {
          id
        }
      }
    `;

    const response = await fetch('http://localhost:3001/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: JSON.stringify({
        query: <%= h.changeCase.upper(h.changeCase.snake(name)) %>_QUERY,
      }),
    });
    const respJson = await response.json() as { data: { <%= h.changeCase.camel(name) %>: <%= h.changeCase.pascal(name) %>[] } };
    const { data: { <%= h.changeCase.camel(name) %>: data } } = respJson;

    expect(data).toHaveLength(MOCK_DB_PAYLOAD.length);
    MOCK_DB_PAYLOAD.forEach((entity, index) => {
      expect(data[index].id).toBe(entity.id);
      expect(data[index].name).toBeUndefined();
    });
  });

  describe('where argument', () => {
    it('should returns correct <%= h.changeCase.camel(name) %>s with where _eq argument', async () => {
      const JWT_TOKEN = fs
        .readFileSync('./tests/keys/valid.access.jwt', 'utf8')
        .trim();

      const <%= h.changeCase.upper(h.changeCase.snake(name)) %>_QUERY = `
        #graphql
        {
          <%= h.changeCase.camel(name) %>(where: { id: { _eq: "7a66ddf6-0c72-4f97-88e0-7f7254ff58a1" } }) {
            id
          }
        }
      `;

      const response = await fetch('http://localhost:3001/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`,
        },
        body: JSON.stringify({
          query: <%= h.changeCase.upper(h.changeCase.snake(name)) %>_QUERY,
        }),
      });
      const respJson = await response.json() as { data: { <%= h.changeCase.camel(name) %>: <%= h.changeCase.pascal(name) %>[] } };
      const { data: { <%= h.changeCase.camel(name) %>: data } } = respJson;

      expect(data).toHaveLength(1);
      expect(data[0].id).toBe('7a66ddf6-0c72-4f97-88e0-7f7254ff58a1');
      expect(data[0].name).toBeUndefined();
    });

    it('should returns correct <%= h.changeCase.camel(name) %>s with where _like argument', async () => {
      const JWT_TOKEN = fs
        .readFileSync('./tests/keys/valid.access.jwt', 'utf8')
        .trim();

      const <%= h.changeCase.upper(h.changeCase.snake(name)) %>_QUERY = `
        #graphql
        {
          <%= h.changeCase.camel(name) %>(where: { name: { _like: "Res" } }) {
            id
          }
        }
      `;

      const response = await fetch('http://localhost:3001/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`,
        },
        body: JSON.stringify({
          query: <%= h.changeCase.upper(h.changeCase.snake(name)) %>_QUERY,
        }),
      });
      const respJson = await response.json() as { data: { <%= h.changeCase.camel(name) %>: <%= h.changeCase.pascal(name) %>[] } };
      const { data: { <%= h.changeCase.camel(name) %>: data } } = respJson;

      expect(data).toHaveLength(1);
      expect(data[0].id).toBe('7a66ddf6-0c72-4f97-88e0-7f7254ff58a1');
      expect(data[0].name).toBeUndefined();
    });

    describe('or, and chains', () => {
      it('should returns correct <%= h.changeCase.camel(name) %>s with "and" chain', async () => {
        const JWT_TOKEN = fs
          .readFileSync('./tests/keys/valid.access.jwt', 'utf8')
          .trim();

        const <%= h.changeCase.upper(h.changeCase.snake(name)) %>_QUERY = `
          #graphql
          {
            <%= h.changeCase.camel(name) %>(where: { _and: [{ id: { _eq: "7a66ddf6-0c72-4f97-88e0-7f7254ff58a1" } }, { id: { _eq: "3a532f0b-5514-4a5b-bd02-d9b10afa33a9" } }] }) {
              id
              name
            }
          }
        `;

        const response = await fetch('http://localhost:3001/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${JWT_TOKEN}`,
          },
          body: JSON.stringify({
            query: <%= h.changeCase.upper(h.changeCase.snake(name)) %>_QUERY,
          }),
        });
        const respJson = await response.json() as { data: { <%= h.changeCase.camel(name) %>: <%= h.changeCase.pascal(name) %>[] } };
        const { data: { <%= h.changeCase.camel(name) %>: data } } = respJson;

        expect(data).toHaveLength(0);
      });
      it('should returns correct <%= h.changeCase.camel(name) %>s with "or" chain', async () => {
        const JWT_TOKEN = fs
          .readFileSync('./tests/keys/valid.access.jwt', 'utf8')
          .trim();

        const <%= h.changeCase.upper(h.changeCase.snake(name)) %>_QUERY = `
          #graphql
          {
            <%= h.changeCase.camel(name) %>(where: { _or: [{ id: { _eq: "7a66ddf6-0c72-4f97-88e0-7f7254ff58a1" } }, { id: { _eq: "3a532f0b-5514-4a5b-bd02-d9b10afa33a9" } }] }) {
              id
              name
            }
          }
        `;

        const response = await fetch('http://localhost:3001/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${JWT_TOKEN}`,
          },
          body: JSON.stringify({
            query: <%= h.changeCase.upper(h.changeCase.snake(name)) %>_QUERY,
          }),
        });
        const respJson = await response.json() as { data: { <%= h.changeCase.camel(name) %>: <%= h.changeCase.pascal(name) %>[] } };
        const { data: { <%= h.changeCase.camel(name) %>: data } } = respJson;

        expect(data).toHaveLength(2);
        expect(data[0].id).toBe('7a66ddf6-0c72-4f97-88e0-7f7254ff58a1');
        expect(data[1].id).toBe('3a532f0b-5514-4a5b-bd02-d9b10afa33a9');
      });
    });
  });

  describe('order argument', () => {
    it('should returns all <%= h.changeCase.camel(name) %>s in correct order if orderBy provided', async () => {
      const JWT_TOKEN = fs
        .readFileSync('./tests/keys/valid.access.jwt', 'utf8')
        .trim();

      const <%= h.changeCase.upper(h.changeCase.snake(name)) %>_QUERY = `
        #graphql
        {
          <%= h.changeCase.camel(name) %>(orderBy: { name: ASC }) {
            id
            name
          }
        }
      `;

      const response = await fetch('http://localhost:3001/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`,
        },
        body: JSON.stringify({
          query: <%= h.changeCase.upper(h.changeCase.snake(name)) %>_QUERY,
        }),
      });
      const respJson = await response.json() as { data: { <%= h.changeCase.camel(name) %>: <%= h.changeCase.pascal(name) %>[] } };
      const { data: { <%= h.changeCase.camel(name) %>: data } } = respJson;

      expect(data).toHaveLength(MOCK_DB_PAYLOAD.length);
      expect(data[0].id).toBe('7a66ddf6-0c72-4f97-88e0-7f7254ff58a1');
      expect(data[1].id).toBe('b7f09cc6-9f4d-41fc-9152-2aa061e712f9');
      expect(data[2].id).toBe('3a532f0b-5514-4a5b-bd02-d9b10afa33a9');
    });
  });

  describe('limit offset argument', () => {
    it('should returns sliced <%= h.changeCase.camel(name) %>s if limit and offset provided', async () => {
      const JWT_TOKEN = fs
        .readFileSync('./tests/keys/valid.access.jwt', 'utf8')
        .trim();

      const <%= h.changeCase.upper(h.changeCase.snake(name)) %>_QUERY = `
        #graphql
        {
          <%= h.changeCase.camel(name) %>(limit: 2, offset: 1, orderBy: { name: ASC }) {
            id
            name
          }
        }
      `;

      const response = await fetch('http://localhost:3001/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`,
        },
        body: JSON.stringify({
          query: <%= h.changeCase.upper(h.changeCase.snake(name)) %>_QUERY,
        }),
      });
      const respJson = await response.json() as { data: { <%= h.changeCase.camel(name) %>: <%= h.changeCase.pascal(name) %>[] } };
      const { data: { <%= h.changeCase.camel(name) %>: data } } = respJson;

      expect(data).toHaveLength(2);
      expect(data[0].id).toBe('b7f09cc6-9f4d-41fc-9152-2aa061e712f9');
      expect(data[1].id).toBe('3a532f0b-5514-4a5b-bd02-d9b10afa33a9');
    });
  });
});
<% } %>
<% if (generationResolvers.includes('selectAggregate')) { %>
describe('<%= h.changeCase.camel(name) %>Aggregate', () => {
  it('should returns all <%= h.changeCase.camel(name) %>s + count if args not provided', async () => {
    const JWT_TOKEN = fs
      .readFileSync('./tests/keys/valid.access.jwt', 'utf8')
      .trim();

    const <%= h.changeCase.upper(h.changeCase.snake(name)) %>_QUERY = `
      #graphql
      {
        <%= h.changeCase.camel(name) %>Aggregate {
          aggregate {
            count
          }
          nodes {
            id
          }
        }
      }
    `;

    const response = await fetch('http://localhost:3001/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: JSON.stringify({
        query: <%= h.changeCase.upper(h.changeCase.snake(name)) %>_QUERY,
      }),
    });
    const respJson = await response.json() as { data: { <%= h.changeCase.camel(name) %>Aggregate: { aggregate: { count: number }, nodes: <%= h.changeCase.pascal(name) %>[] } } };
    const { data: { <%= h.changeCase.camel(name) %>Aggregate: { aggregate: { count }, nodes: data } } } = respJson;

    expect(count).toBe(MOCK_DB_PAYLOAD.length);

    expect(data).toHaveLength(MOCK_DB_PAYLOAD.length);
    MOCK_DB_PAYLOAD.forEach((entity, index) => {
      expect(data[index].id).toBe(entity.id);
      expect(data[index].name).toBeUndefined();
    });
  });

  describe('where argument', () => {
    it('should returns correct <%= h.changeCase.camel(name) %>s + count with where _eq argument', async () => {
      const JWT_TOKEN = fs
        .readFileSync('./tests/keys/valid.access.jwt', 'utf8')
        .trim();

      const <%= h.changeCase.upper(h.changeCase.snake(name)) %>_QUERY = `
        #graphql
        {
          <%= h.changeCase.camel(name) %>Aggregate(where: { id: { _eq: "7a66ddf6-0c72-4f97-88e0-7f7254ff58a1" } }) {
            aggregate {
              count
            }
            nodes {
              id
            }
          }
        }
      `;

      const response = await fetch('http://localhost:3001/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`,
        },
        body: JSON.stringify({
          query: <%= h.changeCase.upper(h.changeCase.snake(name)) %>_QUERY,
        }),
      });
      const respJson = await response.json() as { data: { <%= h.changeCase.camel(name) %>Aggregate: { aggregate: { count: number }, nodes: <%= h.changeCase.pascal(name) %>[] } } };
      const { data: { <%= h.changeCase.camel(name) %>Aggregate: { aggregate: { count }, nodes: data } } } = respJson;

      expect(count).toBe(1);

      expect(data).toHaveLength(1);
      expect(data[0].id).toBe('7a66ddf6-0c72-4f97-88e0-7f7254ff58a1');
      expect(data[0].name).toBeUndefined();
    });

    it('should returns correct <%= h.changeCase.camel(name) %>s + count with where _like argument', async () => {
      const JWT_TOKEN = fs
        .readFileSync('./tests/keys/valid.access.jwt', 'utf8')
        .trim();

      const <%= h.changeCase.upper(h.changeCase.snake(name)) %>_QUERY = `
        #graphql
        {
          <%= h.changeCase.camel(name) %>Aggregate(where: { name: { _like: "Res" } }) {
            aggregate {
              count
            }
            nodes {
              id
            }
          }
        }
      `;

      const response = await fetch('http://localhost:3001/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`,
        },
        body: JSON.stringify({
          query: <%= h.changeCase.upper(h.changeCase.snake(name)) %>_QUERY,
        }),
      });
      const respJson = await response.json() as { data: { <%= h.changeCase.camel(name) %>Aggregate: { aggregate: { count: number }, nodes: <%= h.changeCase.pascal(name) %>[] } } };
      const { data: { <%= h.changeCase.camel(name) %>Aggregate: { aggregate: { count }, nodes: data } } } = respJson;

      expect(count).toBe(1);

      expect(data).toHaveLength(1);
      expect(data[0].id).toBe('7a66ddf6-0c72-4f97-88e0-7f7254ff58a1');
      expect(data[0].name).toBeUndefined();
    });
  });

  describe('order argument', () => {
    it('should returns all <%= h.changeCase.camel(name) %>s + count in correct order if orderBy provided', async () => {
      const JWT_TOKEN = fs
        .readFileSync('./tests/keys/valid.access.jwt', 'utf8')
        .trim();

      const <%= h.changeCase.upper(h.changeCase.snake(name)) %>_QUERY = `
        #graphql
        {
          <%= h.changeCase.camel(name) %>Aggregate(orderBy: { name: ASC }) {
            aggregate {
              count
            }
            nodes {
              id
              name
            }
          }
        }
      `;

      const response = await fetch('http://localhost:3001/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`,
        },
        body: JSON.stringify({
          query: <%= h.changeCase.upper(h.changeCase.snake(name)) %>_QUERY,
        }),
      });
      const respJson = await response.json() as { data: { <%= h.changeCase.camel(name) %>Aggregate: { aggregate: { count: number }, nodes: <%= h.changeCase.pascal(name) %>[] } } };
      const { data: { <%= h.changeCase.camel(name) %>Aggregate: { aggregate: { count }, nodes: data } } } = respJson;

      expect(count).toBe(MOCK_DB_PAYLOAD.length);

      expect(data).toHaveLength(MOCK_DB_PAYLOAD.length);
      expect(data[0].id).toBe('7a66ddf6-0c72-4f97-88e0-7f7254ff58a1');
      expect(data[1].id).toBe('b7f09cc6-9f4d-41fc-9152-2aa061e712f9');
      expect(data[2].id).toBe('3a532f0b-5514-4a5b-bd02-d9b10afa33a9');
    });
  });

  describe('limit offset argument', () => {
    it('should returns sliced <%= h.changeCase.camel(name) %>s + count if limit and offset provided', async () => {
      const JWT_TOKEN = fs
        .readFileSync('./tests/keys/valid.access.jwt', 'utf8')
        .trim();

      const <%= h.changeCase.upper(h.changeCase.snake(name)) %>_QUERY = `
        #graphql
        {
          <%= h.changeCase.camel(name) %>Aggregate(limit: 2, offset: 1, orderBy: { name: ASC }) {
            aggregate {
              count
            }
            nodes {
              id
              name
            }
          }
        }
      `;

      const response = await fetch('http://localhost:3001/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`,
        },
        body: JSON.stringify({
          query: <%= h.changeCase.upper(h.changeCase.snake(name)) %>_QUERY,
        }),
      });
      const respJson = await response.json() as { data: { <%= h.changeCase.camel(name) %>Aggregate: { aggregate: { count: number }, nodes: <%= h.changeCase.pascal(name) %>[] } } };
      const { data: { <%= h.changeCase.camel(name) %>Aggregate: { aggregate: { count }, nodes: data } } } = respJson;

      expect(count).toBe(MOCK_DB_PAYLOAD.length);

      expect(data).toHaveLength(2);
      expect(data[0].id).toBe('b7f09cc6-9f4d-41fc-9152-2aa061e712f9');
      expect(data[1].id).toBe('3a532f0b-5514-4a5b-bd02-d9b10afa33a9');
    });
  });
});
<% } %>

<% if (generationResolvers.includes('selectByPk')) { %>
describe('<%= h.changeCase.camel(name) %>ByPk', () => {
  it('should returns correct <%= h.changeCase.camel(name) %> by id', async () => {
    const JWT_TOKEN = fs
      .readFileSync('./tests/keys/valid.access.jwt', 'utf8')
      .trim();

    const <%= h.changeCase.upper(h.changeCase.snake(name)) %>_QUERY = `
      #graphql
      {
        <%= h.changeCase.camel(name) %>ByPk(id: "3a532f0b-5514-4a5b-bd02-d9b10afa33a9") {
          id
        }
      }
    `;

    const response = await fetch('http://localhost:3001/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: JSON.stringify({
        query: <%= h.changeCase.upper(h.changeCase.snake(name)) %>_QUERY,
      }),
    });
    const respJson = await response.json() as { data: { <%= h.changeCase.camel(name) %>ByPk: <%= h.changeCase.pascal(name) %> } };
    const { data: { <%= h.changeCase.camel(name) %>ByPk: data } } = respJson;

    expect(data.id).toBe(MOCK_DB_PAYLOAD[2].id);
    expect(data.name).toBeUndefined();
  });
});
<% } %>