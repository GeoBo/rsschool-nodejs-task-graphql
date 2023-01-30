import { GraphQLInputObjectType, GraphQLString, GraphQLInt } from 'graphql/type';

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

export {userBodyType, profileBodyType, postBodyType, memberTypeBodyType }