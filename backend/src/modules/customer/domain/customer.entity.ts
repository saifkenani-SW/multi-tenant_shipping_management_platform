/**
 * Customer Domain Entity.
 * Represents the business concept of a Customer profile.
 * Serves as the single contract between Repositories and Application Services.
 */
export class Customer {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly email: string,
    public readonly fullName: string,
    public readonly phone: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
