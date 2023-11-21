// index.ts

import loggerFactory from './helpers/logger.js';
import CustomError from './helpers/CustomError.js';
import jwtMiddleware, { WVServiceContext } from './middlewares/jwtMiddleware.js';

import { RabbitMQ } from './helpers/rmq/RabbitMQ.js';
import { RabbitMQPublish, RabbitMQPublishOptions, RabbitMQPublishTargetType } from './helpers/rmq/handlers/RabbitMQPublish.js';
import { RabbitMQConsumer, RabbitMQConsumerOptions } from './helpers/rmq/handlers/RabbitMQConsumer.js';
import { createSchema, createBaseTypes, graphqlInfoHasSelection, graphqlInfoToPrismaInclude, graphqlSelectionSetToPrismaInclude, graphqlWhereToPrismaWhere, graphqlOrderByToPrismaOrderBy } from './hasura/index.js';
import type { PrismaWhere } from './hasura';

export {
  jwtMiddleware,
  WVServiceContext,
  loggerFactory,
  CustomError,
  RabbitMQ,
  RabbitMQPublish,
  RabbitMQConsumerOptions,
  RabbitMQPublishTargetType,
  RabbitMQConsumer,
  RabbitMQPublishOptions,
  createSchema,
  createBaseTypes,
  graphqlInfoHasSelection,
  graphqlInfoToPrismaInclude,
  graphqlSelectionSetToPrismaInclude,
  graphqlWhereToPrismaWhere,
  graphqlOrderByToPrismaOrderBy,
};

export type {
  PrismaWhere,
};
