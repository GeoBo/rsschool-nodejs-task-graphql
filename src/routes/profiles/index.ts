import { HttpError } from '@fastify/sensible/lib/httpError';
import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createProfileBodySchema, changeProfileBodySchema } from './schema';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<ProfileEntity[]> {
    return fastify.db.profiles.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity | HttpError> {
      const id = request.params.id;
      try {
        const profile = await fastify.db.profiles.findOne({key: 'id', equals: id });
        if(!profile) throw new Error(`Profile with id=${id} not exist`);
        return profile;
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
        body: createProfileBodySchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity | HttpError> {
      const profileBody = request.body;
      const { userId, memberTypeId } = profileBody;
      try {
        const user = await fastify.db.users.findOne({key: 'id', equals: userId });
        if(!user) throw new Error(`User with id=${userId} not exist`);
    
        const memberTypes = await fastify.db.memberTypes.findOne({key: 'id', equals: memberTypeId });
        if(!memberTypes) throw new Error(`Member type with id=${memberTypeId} not exist`);
        
        const foundProfile = await fastify.db.profiles.findOne({key: 'userId', equals: userId });
        if(foundProfile) throw new Error(`Profile with userId=${memberTypeId} already exist`);
        
        const profile = await fastify.db.profiles.create(profileBody);
        if(!profile) throw new Error(`User not created`);
        reply.code(201);
        return profile;
      } catch(err) {
        if (err instanceof Error) return fastify.httpErrors.badRequest(err.message);
        return fastify.httpErrors.internalServerError();
      }
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity | HttpError> {
      const id = request.params.id;
      try {
        const profile = await fastify.db.profiles.delete(id);
        if(!profile) throw new Error(`user with id=${id} not exist`);
        return profile;   
      } catch(err) {
        if (err instanceof Error) return fastify.httpErrors.badRequest(err.message);
        return fastify.httpErrors.internalServerError();
      }
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeProfileBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity | HttpError> {
      const id = request.params.id;
      const postBody = request.body;

      try {
       const profile = await fastify.db.profiles.change(id, postBody);
       return profile;
      } catch(err) {
          if (err instanceof Error) return fastify.httpErrors.badRequest(err.message);
          return fastify.httpErrors.internalServerError();
      }
    }
  );
};

export default plugin;
