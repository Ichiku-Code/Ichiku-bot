export type SnakeToCamel<S extends string> = S extends `${infer T}_${infer U}`
    ? `${T}${Capitalize<SnakeToCamel<U>>}`
    : S;

export type CamelToSnake<S extends string> = S extends `${infer T}${infer U}`
    ? U extends Uncapitalize<U>
    ? `${Uncapitalize<T>}${CamelToSnake<U>}`
    : `${Uncapitalize<T>}_${CamelToSnake<Uncapitalize<U>>}`
    : S;

export const snakeToCamel = <S extends string>(str: S) =>
    str.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase()) as SnakeToCamel<S>;

export const camelToSnake = <S extends string>(str: S) =>
    str.replace(/([A-Z])/g, '_$1').toLowerCase() as CamelToSnake<S>;