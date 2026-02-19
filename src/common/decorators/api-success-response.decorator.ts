import { Type, applyDecorators } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  ReferenceObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

type Options = {
  description?: string;
  isArray?: boolean;
  /** Use for inline/custom schema instead of a DTO type */
  schema?: SchemaObject;
};

type InnerSchema = SchemaObject | ReferenceObject;

const wrap = (data: InnerSchema, code: number): SchemaObject => ({
  properties: {
    status: { type: 'string', example: 'success' },
    code: { type: 'number', example: code },
    data: data as SchemaObject,
  },
});

/**
 * Wraps @ApiOkResponse in the standard success envelope:
 * { status: "success", code: 200, data: <type> }
 */
export const ApiSuccessResponse = <T>(
  type?: Type<T> | null,
  options: Options = {},
) => {
  const { description, isArray, schema: customSchema } = options;

  const inner: InnerSchema = customSchema
    ? customSchema
    : type
      ? isArray
        ? { type: 'array', items: { $ref: getSchemaPath(type) } }
        : { $ref: getSchemaPath(type) }
      : {};

  return applyDecorators(
    ...(type ? [ApiExtraModels(type)] : []),
    ApiOkResponse({ description, schema: wrap(inner, 200) }),
  );
};

/**
 * Wraps @ApiCreatedResponse in the standard success envelope:
 * { status: "success", code: 201, data: <type> }
 */
export const ApiCreatedSuccessResponse = <T>(
  type?: Type<T> | null,
  options: Options = {},
) => {
  const { description, schema: customSchema } = options;

  const inner: InnerSchema = customSchema
    ? customSchema
    : type
      ? { $ref: getSchemaPath(type) }
      : {};

  return applyDecorators(
    ...(type ? [ApiExtraModels(type)] : []),
    ApiCreatedResponse({ description, schema: wrap(inner, 201) }),
  );
};
