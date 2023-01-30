import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import depthLimit = require( 'graphql-depth-limit' );
import { ExecutionResult } from 'graphql/execution';
import { graphql } from 'graphql/graphql';
import { GraphQLList, GraphQLObjectType, GraphQLSchema, GraphQLID } from 'graphql/type';
import { memberTypeBodyType, postBodyType, profileBodyType, userBodyType } from './input-types';
import { graphqlBodySchema } from './schema';
import { allAboutUserType, memberTypeType, postType, profileType, userType } from './types';


const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.post(
    '/',
    {
      schema: {
        body: graphqlBodySchema,
        validationRules: [ depthLimit(1) ]
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
              if(!id) throw new Error(`ID required`);
              const user = await fastify.db.users.findOne({key: 'id', equals: id });
              if(!user) throw new Error(`User with id=${id} not exist`);
              return user;
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
              const profile = await fastify.db.profiles.findOne({key: 'id', equals: id });
              if(!profile) throw new Error(`Profile with id=${id} not exist`);
              return profile;
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
              const post = await fastify.db.posts.findOne({key: 'id', equals: id });
              if(!post) throw new Error(`Post with id=${id} not exist`);
              return post;
            },
          },

          //memberTypes

          memberTypes: {
            type: new GraphQLList(memberTypeType),
            resolve: () => fastify.db.memberTypes.findMany(),
          },

          memberType: {
            type: memberTypeType,
            args: {
              id: { type: GraphQLID },
            },
            resolve: async (_, { id }) => {
              const memberType = await fastify.db.memberTypes.findOne({key: 'id', equals: id });
              if(!memberType) throw new Error(`Member type with id=${id} not exist`);
              return memberType;
            },
          },

          getAllAboutUsers: {
            type: new GraphQLList(allAboutUserType),
            resolve: async () => {
              const users = await fastify.db.users.findMany();
              const allAboutUsers = users.map(async(user) => {
                let memberType = null;
                const profile = await fastify.db.profiles.findOne({key: 'userId', equals: user.id });   
                if(profile) {
                  memberType = await fastify.db.memberTypes.findOne({key: 'id', equals: profile.memberTypeId });
                }
                const posts = await fastify.db.posts.findMany({key: 'userId', equals: user.id });
                return {...user, profile, posts, memberType}
              }) 
              return allAboutUsers;
            }
          },

          getAllAboutUser: {
            type: allAboutUserType,
            args: {
              id: { type: GraphQLID },
            },
            resolve: async (source, args) => {
              const id = args?.id;
              const user = await fastify.db.users.findOne({key: 'id', equals: id });
              if(!user) throw new Error(`User with id=${id} not exist`);
              
              let memberType = null;
              const profile = await fastify.db.profiles.findOne({key: 'userId', equals: user.id });   
              if(profile) {
                memberType = await fastify.db.memberTypes.findOne({key: 'id', equals: profile.memberTypeId });
              }
              const posts = await fastify.db.posts.findMany({key: 'userId', equals: user.id });
              return {...user, profile, posts, memberType}
            }
          },

          getUsersSubsAndProfile: {
            type: new GraphQLList(allAboutUserType),
            resolve: async () => {
              const users = await fastify.db.users.findMany();
              const allAboutUsers = users.map(async(user) => {
                const relatedUsers = await fastify.db.users.findMany({key: 'subscribedToUserIds', inArray: user.id });
                
                let userSubscribedTo: string[] = [];
                relatedUsers.forEach(async(relatedUser) => {
                  userSubscribedTo.push(relatedUser.id);
                })

                const profile = await fastify.db.profiles.findOne({key: 'userId', equals: user.id });   
                return {...user, userSubscribedTo, profile}
              }) 
              return allAboutUsers;
            }
          },

          getUserPostsSubs: {
            type: allAboutUserType,
            args: {
              id: { type: GraphQLID },
            },
            resolve: async (source, args) => {
              const id = args?.id;
              const user = await fastify.db.users.findOne({key: 'id', equals: id });
              if(!user) throw new Error(`User with id=${id} not exist`);
              
              const posts = await fastify.db.posts.findMany({key: 'userId', equals: user.id });
              return {...user, subscribedToUser: user.subscribedToUserIds , posts}
            }
          },

          getUsersWithSubs: {
            type: new GraphQLList(allAboutUserType),
            resolve: async () => {
              const users = await fastify.db.users.findMany();
              const allAboutUsers = users.map(async(user) => {
                const relatedUsers = await fastify.db.users.findMany({key: 'subscribedToUserIds', inArray: user.id });
                
                let userSubscribedTo: string[] = [];
                relatedUsers.forEach(async(relatedUser) => {
                  userSubscribedTo.push(relatedUser.id);
                })

                return {...user, userSubscribedTo, subscribedToUser: user.subscribedToUserIds}
              }) 
              return allAboutUsers;
            }
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
              const userBody = args?.input;
              const user = await fastify.db.users.create(userBody);
              if(!user) throw new Error(`User not created`);
              return user;
            }
          },


          updateUser: {
            type: userType,
            args: {
              id: { type: GraphQLID },
              body: { type: userBodyType }
            },
            resolve: async (source, args) => {
              const id = args?.id
              const userBody = args?.body;
              const checkUser = await fastify.db.users.findOne({key: 'id', equals: id });
              if(!checkUser) throw new Error(`User with id=${id} not exist`);
              const user = await fastify.db.users.change(id, userBody);
              return user;
            }
          },

          subscribeTo: {
            type: userType,
            args: {
              id: { type: GraphQLID },
              userId: { type: GraphQLID }
            },
            resolve: async (source, args) => {
              const id = args?.id;
              const userId = args?.userId;

              if(id === userId) throw new Error("you can't subscribe to yourself");

              const user = await fastify.db.users.findOne({key: 'id', equals: userId });
              if(!user) throw new Error(`user with id=${id} not exist`);
              
              const targetUser = await fastify.db.users.findOne({key: 'id', equals: id });
              if(!targetUser) throw new Error(`user with id=${userId} not exist`);
              
              if(user.subscribedToUserIds.indexOf(id) == -1) {
                const subscribedToUserIds = user.subscribedToUserIds;
                subscribedToUserIds.push(id);
                return fastify.db.users.change(userId, {subscribedToUserIds});
              }
              throw new Error(`User with id=${id} already subscribed`);
            }
          },

          unsubscribeFrom: {
            type: userType,
            args: {
              id: { type: GraphQLID },
              userId: { type: GraphQLID }
            },
            resolve: async (source, args) => {
              const id = args?.id;
              const userId = args?.userId;

              if(id === userId) throw new Error("you can't unsubscribe from yourself");

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
              throw new Error(`User with id=${id} was not subcribed`);
            }
          },

          //profiles

          createProfile: {
            type: profileType,
            args: {
              input: { type: profileBodyType }
            },
            resolve: async (source, args) => {
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
              return profile;
            }
          },

          updateProfile: {
            type: profileType,
            args: {
              id: { type: GraphQLID },
              body: { type: profileBodyType }
            },
            resolve: async (source, args) => { 
                const id = args?.id
                const profileBody = args?.body;
                const checkProfile = await fastify.db.profiles.findOne({key: 'id', equals: id });
                if(!checkProfile) throw new Error(`Profile with id=${id} not exist`);

                const profile = await fastify.db.profiles.change(id, profileBody);
                return profile;
            }
          },

          //posts

          createPost: {
            type: postType,
            args: {
              input: { type: postBodyType }
            },
            resolve: async (source, args) => {
              const postBody = args?.input;
              const user = await fastify.db.users.findOne({key: 'id', equals: postBody.userId });
              if(!user) throw new Error(`User with id=${postBody.userId} not exist`);
              
              const post = await fastify.db.posts.create(postBody);
              if(!post) throw new Error(`User not created`);
              return post;
            }
          },

          updatePost: {
            type: postType,
            args: {
              id: { type: GraphQLID },
              body: { type: postBodyType }
            },
            resolve: async (source, args) => {        
              const id = args?.id
              const postBody = args?.body;
              const checkPost = await fastify.db.posts.findOne({key: 'id', equals: id });
              if(!checkPost) throw new Error(`Post with id=${postBody.userId} not exist`);
              const post = await fastify.db.posts.change(id, postBody);
              return post
            },   
          },

          //memberTypes

          updateMemberType: {
            type: memberTypeType,
            args: {
              id: { type: GraphQLID },
              body: { type: memberTypeBodyType }
            },
            resolve: async (source, args: Record<string, unknown>) => {        
              const id = args?.id as string;
              const memberTypeBody = args?.body as Record<string, unknown>;
              const checkMemberType = await fastify.db.memberTypes.findOne({key: 'id', equals: id });
              if(!checkMemberType) throw new Error(`Member type with id=${id} not exist`);
              
              const memberType = await fastify.db.memberTypes.change(id, memberTypeBody);
              if(!memberType) throw new Error(`Member type with id=${id} not exist`);
              return memberType;
            }
          },

        })
      });

      const schema = new GraphQLSchema({
        query: queryType,
        mutation: mutationType,
        types: [userType, profileType, postType, memberTypeType, userBodyType, 
                profileBodyType, postBodyType, memberTypeBodyType, allAboutUserType],
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
