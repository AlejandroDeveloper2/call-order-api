export abstract class InfrastructureException extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);

    this.name = this.constructor.name;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
