import { HttpError } from '@fastify/sensible/lib/httpError';
import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
    return fastify.db.users.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity | HttpError> {
      const id = request.params.id;
      try {
        const user = await fastify.db.users.findOne({key: 'id', equals: id });
        if(!user) throw new Error(`User with id=${id} not exist`);
        return user;
      } catch(err) {
          if (err instanceof Error) return fastify.httpErrors.notFound(err.message);
          return fastify.httpErrors.internalServerError();
      }
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (request, reply): Promise<UserEntity | HttpError> {
      const userBody = request.body;
      try {
        const user = await fastify.db.users.create(userBody);
        if(!user) throw new Error(`User not created`);
        reply.code(201);
        return user;
      } catch(err) {
          if (err instanceof Error) return fastify.httpErrors.badRequest(err.message);
          return fastify.httpErrors.internalServerError();
      }
    }
  );

  //Нужно отписать оставшихся пользователей от удаленного
  //При удалении юзера, удалить его посты
  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity | HttpError> {
      const id = request.params.id;
      try {
        const user = await fastify.db.users.delete(id);
        if(!user) throw new Error(`user with id=${id} not exist`);
        
        const profile = await fastify.db.profiles.findOne({key: 'userId', equals: id })
        if(profile) await fastify.db.profiles.delete(profile.id);
        
        const posts = await fastify.db.posts.findMany({key: 'userId', equals: id });
        posts.forEach(async(post) => {
          await fastify.db.posts.delete(post.id);
        })

        const relatedUsers = await fastify.db.users.findMany({key: 'subscribedToUserIds', inArray: id });
        relatedUsers.forEach(async(user) => {
          const pos = user.subscribedToUserIds.indexOf(id);
          const subscribedToUserIds = user.subscribedToUserIds;
          subscribedToUserIds.splice(pos, 1);
          await fastify.db.users.change(user.id, {subscribedToUserIds});
        })
        return user;   
      } catch(err) {
        if (err instanceof Error) {
          return fastify.httpErrors.badRequest(err.message);
        } 
        return fastify.httpErrors.internalServerError();
      }
    }
  );

  fastify.post(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity | HttpError> {
      const id = request.params.id;
      const userId = request.body.userId;
      if(id === userId) return fastify.httpErrors.badRequest("you can't subscribe to yourself");
      try {
        const user = await fastify.db.users.findOne({key: 'id', equals: userId });
        if(!user) throw new Error(`user with id=${id} not exist`);
        const targetUser = await fastify.db.users.findOne({key: 'id', equals: id });
        if(!targetUser) throw new Error(`user with id=${userId} not exist`);
        if(user.subscribedToUserIds.indexOf(id) == -1) {
          const subscribedToUserIds = user.subscribedToUserIds;
          subscribedToUserIds.push(id);
          return fastify.db.users.change(userId, {subscribedToUserIds});
        }
        return user;
      } catch(err) {
        if (err instanceof Error) {
          return fastify.httpErrors.notFound(err.message);
        } 
        return fastify.httpErrors.internalServerError();
      }
    }
  );

  fastify.post(
    '/:id/unsubscribeFrom',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity | HttpError> {
      const id = request.params.id;
      const userId = request.body.userId;
      if(id === userId) return fastify.httpErrors.badRequest("you can't unsubscribe from yourself");
      try {
        const user = await fastify.db.users.findOne({key: 'id', equals: userId });
        if(!user) throw new Error(`user with id=${id} not exist`);
        const targetUser = await fastify.db.users.findOne({key: 'id', equals: id });    
        if(!targetUser) throw new Error(`user with id=${userId} not exist`);
        const pos = user.subscribedToUserIds.indexOf(id);
        if(pos !== -1) {
          const subscribedToUserIds = user.subscribedToUserIds;
          subscribedToUserIds.splice(pos, 1);
          return fastify.db.users.change(userId, {subscribedToUserIds});
        }
        return fastify.httpErrors.badRequest('userId is valid but our user is not following him');
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
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity | HttpError> {
      const id = request.params.id;
      const userBody = request.body;

      try {
         const user = await fastify.db.users.change(id, userBody);
         return user;
      } catch(err) {
          if (err instanceof Error) return fastify.httpErrors.badRequest(err.message);
          return fastify.httpErrors.internalServerError();
      }
    }
  );
};

export default plugin;
