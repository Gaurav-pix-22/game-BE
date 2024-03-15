import { GraphQLScalarType, Kind } from "graphql";

export default new GraphQLScalarType({
  name: "Decimal",
  description: "The `Decimal` scalar type to represent decimal values",

  serialize(value) {
    return Number(value);
  },

  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      // @ts-ignore | TS2339
      throw new TypeError(`${String(ast.value)} is not a valid decimal value.`);
    }

    return Number(ast.value);
  },

  parseValue(value) {
    return Number(value);
  }
});