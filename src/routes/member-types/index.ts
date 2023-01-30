import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { changeMemberTypeBodySchema } from './schema';
import type { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';
import { HttpError } from '@fastify/sensible/lib/httpError';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<
  MemberTypeEntity[]
> {
    return fastify.db.memberTypes.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity | HttpError> {
      const id = request.params.id;
      try {
        const memberType = await fastify.db.memberTypes.findOne({key: 'id', equals: id });
        if(!memberType) throw new Error(`Member type with id=${id} not exist`);
        return memberType;
      } catch(err) {
        if (err instanceof Error) return fastify.httpErrors.notFound(err.message);
        return fastify.httpErrors.internalServerError();
      }
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeMemberTypeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity | HttpError> {
      const id = request.params.id;
      const memberTypeBody = request.body;
      try {
        const memberType = await fastify.db.memberTypes.change(id, memberTypeBody);
        if(!memberType) throw new Error(`Member type with id=${id} not exist`);
        return memberType;
      } catch(err) {
        if (err instanceof Error) return fastify.httpErrors.badRequest(err.message);
        return fastify.httpErrors.internalServerError();
      }
    }
  );
};

export default plugin;
