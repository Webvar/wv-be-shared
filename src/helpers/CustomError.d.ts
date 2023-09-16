// helpers/CustomError.d.ts

declare class CustomError extends Error {
  constructor(message: string, err?: Error);
}
export default CustomError;
