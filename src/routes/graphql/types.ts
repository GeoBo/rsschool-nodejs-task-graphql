import { GraphQLObjectType, GraphQLID, GraphQLString, GraphQLList, GraphQLInt, GraphQLInputObjectType } from 'graphql/type';

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

const userBodyType = new GraphQLInputObjectType({
  name: 'UserBody',
  fields: {
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString },
  }
});

const profileBodyType = new GraphQLInputObjectType({
  name: 'ProfileBody',
  fields: {
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

const postBodyType = new GraphQLInputObjectType({
  name: 'PostBody',
  fields: {
    title: { type: GraphQLString },
    content: { type: GraphQLString },
    userId: { type: GraphQLString },
  }
});

const memberTypeBodyType = new GraphQLInputObjectType({
  name: 'MemberTypeBody',
  fields: {
    discount: { type: GraphQLInt },
    monthPostsLimit: { type: GraphQLInt },
  }
});

export {userType, profileType, postType, memberTypeType, 
        userBodyType, profileBodyType, postBodyType, memberTypeBodyType}