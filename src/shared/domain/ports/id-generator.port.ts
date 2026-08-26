export abstract class IdGeneratorPort {
  abstract generate: () => string;
}
export const ID_GENERATOR_KEY = Symbol('ID_GENERATOR_KEY');
