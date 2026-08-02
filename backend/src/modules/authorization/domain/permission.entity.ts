/**
 * Permission Domain Entity.
 *
 * Represents an atomic authorization permission within the system catalog.
 */
export class Permission {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly resource: string,
    public readonly action: string,
    public readonly description: string | null = null,
  ) {}
}
