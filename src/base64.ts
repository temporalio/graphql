import { GraphQLScalarType } from 'graphql'
import { encode, decode } from 'base64-arraybuffer'
import { Kind } from 'graphql/language'

export const Base64 = new GraphQLScalarType({
  name: 'Base64',
  description: `The \`Base64\` scalar type is Base64-encoded binary field.`,

  parseValue(value) {
    if (!(typeof value === 'string')) {
      throw new Error('Base64 values must be strings')
    }

    return new Uint8Array(decode(value))
  },

  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new Error('Base64 literals must be strings')
    }

    return new Uint8Array(decode(ast.value))
  },

  serialize(binary) {
    if (!(binary instanceof Uint8Array)) {
      throw new Error(
        'Resolvers for Base64 scalars must return instances of Uint8Array'
      )
    }

    return encode(binary.buffer)
  },
})
