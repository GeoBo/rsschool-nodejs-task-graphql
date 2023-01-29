import { GraphQLObjectType, GraphQLID, GraphQLString, GraphQLList, GraphQLInt } from 'graphql/type';

const userType = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: GraphQLID },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString },
    subscribedToUserIds: { type: new GraphQLList(GraphQLString) },
  }
});

const profileType = new GraphQLObjectType({
  name: 'Profile',
  fields: {
    id: { type: GraphQLID },
    avatar: { type: GraphQLString },
    sex: { type: GraphQLString },
    birthday: { type: GraphQLInt },
    country: { type: GraphQLString },
    street: { type: GraphQLString },
    city: { type: GraphQLString },
    memberTypeId: { type: GraphQLString },
    userId: { type: GraphQLString },
  }
});

const postType = new GraphQLObjectType({
  name: 'Post',
  fields: {
    id: { type: GraphQLID },
    title: { type: GraphQLString },
    content: { type: GraphQLString },
    userId: { type: GraphQLString },
  }
});

const memberTypeType = new GraphQLObjectType({
  name: 'MemberType',
  fields: {
    id: { type: GraphQLID },
    discount: { type: GraphQLInt },
    monthPostsLimit: { type: GraphQLInt },
  }
});

const allAboutUserType = new GraphQLObjectType({
  name: 'AllAboutUser',
  fields: {
    id: { type: GraphQLID },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString },
    subscribedToUser: { type: new GraphQLList(GraphQLString) },
    subscribedToUserIds: { type: new GraphQLList(GraphQLString) },
    userSubscribedTo: { type: new GraphQLList(GraphQLString) },
    
    profile: {
      type: profileType,
    },
    posts: {
      type: new GraphQLList(postType),
    },
    memberType: {
      type: memberTypeType,
    }
  }
});

// const userSubscribedType = new GraphQLObjectType({
//   name: 'AllAboutUser',
//   fields: {
//     id: { type: GraphQLID },
//     firstName: { type: GraphQLString },
//     lastName: { type: GraphQLString },
//     email: { type: GraphQLString },
//     subscribedToUserIds: { type: new GraphQLList(GraphQLString) },
//     userSubscribedTo: { type: new GraphQLList(GraphQLString) },
//     profile: {
//       type: profileType,
//     },
//   }
// });

export {userType, profileType, postType, memberTypeType, allAboutUserType}
        