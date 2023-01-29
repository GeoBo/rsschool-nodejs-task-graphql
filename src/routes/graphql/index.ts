import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { ExecutionResult } from 'graphql/execution';
import { graphql } from 'graphql/graphql';
import { GraphQLList, GraphQLObjectType, GraphQLSchema, GraphQLID } from 'graphql/type';
import { graphqlBodySchema } from './schema';
import { memberTypeType, postType, profileType, userType, userBodyType, profileBodyType, postBodyType, memberTypeBodyType } from './types';


const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.post(
    '/',
    {
      schema: {
        body: graphqlBodySchema,
      },
    },
    async function (request, reply) {
      const source: string = String(request.body.query);
      const variableValues: Variables = request.body.variables;
      
      const queryType = new GraphQLObjectType({
        name: 'Query',
        fields: () => ({

          //users

          users: {
            type: new GraphQLList(userType),
            resolve: () => fastify.db.users.findMany(),
          },

          user: {
            type: userType,
            args: {
              id: { type: GraphQLID },
            },
            resolve: async (_, { id }) => {
              try {              
                if(!id) throw new Error(`ID required`);
                const user = await fastify.db.users.findOne({key: 'id', equals: id });
                if(!user) throw new Error(`User with id=${id} not exist`);
                return user;
              } catch(err) {
                  if (err instanceof Error) return fastify.httpErrors.notFound(err.message);
                  return fastify.httpErrors.internalServerError();
              }
            },
          },

          //profiles

          profiles: {
            type: new GraphQLList(profileType),
            resolve: () => fastify.db.profiles.findMany(),
          },

          profile: {
            type: profileType,
            args: {
              id: { type: GraphQLID },
            },
            resolve: async (_, { id }) => {
              try {
                const profile = await fastify.db.profiles.findOne({key: 'id', equals: id });
                if(!profile) throw new Error(`Profile with id=${id} not exist`);
                return profile;
              } catch(err) {
                  if (err instanceof Error) return fastify.httpErrors.notFound(err.message);
                  return fastify.httpErrors.internalServerError();
              }
            },
          },

          //posts

          posts: {
            type: new GraphQLList(postType),
            resolve: (args, context, info) => fastify.db.posts.findMany(),
          },

          post: {
            type: postType,
            args: {
              id: { type: GraphQLID },
            },
            resolve: async (_, { id }) => {
              try {
                const post = await fastify.db.posts.findOne({key: 'id', equals: id });
                if(!post) throw new Error(`Post with id=${id} not exist`);
                return post;
              } catch(err) {
                if (err instanceof Error) return fastify.httpErrors.notFound(err.message);
                return fastify.httpErrors.internalServerError();
              }
            },
          },

          //memberTypes

          memberTypes: {
            type: new GraphQLList(memberTypeType),
            resolve: (args, context, info) => fastify.db.memberTypes.findMany(),
          },

          memberType: {
            type: memberTypeType,
            args: {
              id: { type: GraphQLID },
            },
            resolve: async (_, { id }) => {
              try {
                const memberType = await fastify.db.memberTypes.findOne({key: 'id', equals: id });
                if(!memberType) throw new Error(`Member type with id=${id} not exist`);
                return memberType;
              } catch(err) {
                if (err instanceof Error) return fastify.httpErrors.notFound(err.message);
                return fastify.httpErrors.internalServerError();
              }
            },
          },
        }),
      });

      
      const mutationType = new GraphQLObjectType({
        name: 'Mutation',
        fields: () => ({

          //users

          createUser: {
            type: userType,
            args: {
              input: { type: userBodyType }
            },
            resolve: async (source, args) => {
              try {
                const userBody = args?.input;
                const user = await fastify.db.users.create(userBody);
                if(!user) throw new Error(`User not created`);
                reply.code(201);
                return user;
              } catch(err) {
                  if (err instanceof Error) return fastify.httpErrors.badRequest(err.message);
                  return fastify.httpErrors.internalServerError();
              }
            }
          },


          updateUser: {
            type: userType,
            args: {
              id: { type: GraphQLID },
              body: { type: userBodyType }
            },
            resolve: async (source, args) => {

              try {
                const id = args.id
                const userBody = args.body;
                const checkUser = await fastify.db.users.findOne({key: 'id', equals: id });
                if(!checkUser) throw new Error(`User with id=${id} not exist`);
                const user = await fastify.db.users.change(id, userBody);
                return user;
              } catch(err) {
                  if (err instanceof Error) return fastify.httpErrors.badRequest(err.message);
                  return fastify.httpErrors.internalServerError();
              }
            }
          },

          //profiles

          createProfile: {
            type: profileType,
            args: {
              input: { type: profileBodyType }
            },
            resolve: async (source, args) => {
              try {
                const profileBody = args?.input;
                const { userId, memberTypeId } = profileBody;
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
          },

          updateProfile: {
            type: profileType,
            args: {
              id: { type: GraphQLID },
              body: { type: profileBodyType }
            },
            resolve: async (source, args) => { 
              try {
                const id = args?.id
                const profileBody = args?.body;
                const checkProfile = await fastify.db.profiles.findOne({key: 'id', equals: id });
                if(!checkProfile) throw new Error(`Profile with id=${id} not exist`);

                const profile = await fastify.db.profiles.change(id, profileBody);
                return profile;
              } catch(err) {
                  if (err instanceof Error) return fastify.httpErrors.badRequest(err.message);
                  return fastify.httpErrors.internalServerError();
              }
            }
          },

          //posts

          createPost: {
            type: postType,
            args: {
              input: { type: postBodyType }
            },
            resolve: async (source, args) => {
              try {
                const postBody = args?.input;
                const user = await fastify.db.users.findOne({key: 'id', equals: postBody.userId });
                if(!user) throw new Error(`User with id=${postBody.userId} not exist`);
                
                const post = await fastify.db.posts.create(postBody);
                if(!post) throw new Error(`User not created`);
                reply.code(201);
                return post;
              } catch(err) {
                  if (err instanceof Error) return fastify.httpErrors.badRequest(err.message);
                  return fastify.httpErrors.internalServerError();
              }    
            }
          },

          updatePost: {
            type: postType,
            args: {
              id: { type: GraphQLID },
              body: { type: postBodyType }
            },
            resolve: async (source, args) => {        
              try {
                const id = args?.id
                const postBody = args?.body;
                const checkPost = await fastify.db.posts.findOne({key: 'id', equals: id });
                if(!checkPost) throw new Error(`Post with id=${postBody.userId} not exist`);
                const post = await fastify.db.posts.change(id, postBody);
                return post
              } catch(err) {
                  if (err instanceof Error) return fastify.httpErrors.badRequest(err.message);
                  return fastify.httpErrors.internalServerError();
              }
            },   
          },

          //memberTypes

          updateMemberType: {
            type: memberTypeType,
            args: {
              id: { type: GraphQLID },
              body: { type: memberTypeBodyType }
            },
            resolve: async (source, args) => {        
              try {
                const id = args?.id
                const memberTypeBody = args?.body;
                const checkMemberType = await fastify.db.memberTypes.findOne({key: 'id', equals: id });
                if(!checkMemberType) throw new Error(`Member type with id=${id} not exist`);
                const memberType = await fastify.db.memberTypes.change(id, memberTypeBody);
                if(!memberType) throw new Error(`Member type with id=${id} not exist`);
                return memberType;
              } catch(err) {
                if (err instanceof Error) return fastify.httpErrors.badRequest(err.message);
                return fastify.httpErrors.internalServerError();
              }
            }
          },

        })
      });

      const schema = new GraphQLSchema({
        query: queryType,
        mutation: mutationType,
        types: [userType, profileType, postType, memberTypeType, userBodyType, 
                profileBodyType, postBodyType, memberTypeBodyType],
      });

      return await graphql({ schema, source, variableValues }).then((response: ExecutionResult) => {
        console.log({...response.data});
        return response;
      });
    }
  );
};

type Variables = {
  [x: string]: unknown;
} | undefined

export default plugin;

      // const = new GraphQLSchema({
      //   query: MyAppQueryRootType
      //   mutation: MyAppMutationRootType
      // });

      // const schema = buildSchema(`
      //   type Query {
      //     users: String
      //   }
      // `);

      // const rootValue = { users: () => 'Hello world!' };

      // return await graphql({
      //   schema: StarWarsSchema,
      //   source: String(request.body.query),
      //   contextValue: fastify,
      //   variableValues: 'qwer'
      // });
      // resolve(source, args, context){

      // context.inject({
      //   method: 'POST',
      //   url: '/users',
      //   payload: args,
      // })
      // }