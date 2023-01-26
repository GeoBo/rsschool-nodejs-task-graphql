import { HttpError } from '@fastify/sensible/lib/httpError';
import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createPostBodySchema, changePostBodySchema } from './schema';
import type { PostEntity } from '../../utils/DB/entities/DBPosts';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<PostEntity[]> {
    return fastify.db.posts.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity | HttpError> {
      const id = request.params.id;
      try {
        const post = await fastify.db.posts.findOne({key: 'id', equals: id });
        if(!post) throw new Error(`Post with id=${id} not exist`);
        return post;
      } catch(err) {
        if (err instanceof Error) return fastify.httpErrors.notFound(err.message);
        return fastify.httpErrors.internalServerError();
      }
    }
  );
  
  //Проверить сущестовование пользователя, написавшего пост
  fastify.post(
    '/',
    {
      schema: {
        body: createPostBodySchema,
      },
    },
    async function (request, reply): Promise<PostEntity | HttpError> {
      const postBody = request.body;
      try {
        const post = await fastify.db.posts.create(postBody);
        if(!post) throw new Error(`User not created`);
        reply.code(201);
        return post;
      } catch(err) {
          if (err instanceof Error) return fastify.httpErrors.badRequest(err.message);
          return fastify.httpErrors.internalServerError();
      }}
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity | HttpError> {
      const id = request.params.id;
      try {
        const post = await fastify.db.posts.delete(id);
        if(!post) throw new Error(`Post with id=${id} not exist`);
        return post;   
      } catch(err) {
        if (err instanceof Error) {
          return fastify.httpErrors.notFound(err.message);
        } 
        return fastify.httpErrors.internalServerError();
      }
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changePostBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity | HttpError> {
      const id = request.params.id;
      const postBody = request.body;

      try {
        return fastify.db.posts.change(id, postBody);
      } catch(err) {
          if (err instanceof Error) return fastify.httpErrors.badRequest(err.message);
          return fastify.httpErrors.internalServerError();
      }
    }
  );
};

export default plugin;
