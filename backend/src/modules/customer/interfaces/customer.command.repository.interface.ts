export interface ICustomerCommandRepository {
  existsByEmailOrPhone(email: string, phone: string): Promise<boolean>;
  createUser(data: {
    email: string;
    phone: string;
    passwordHash: string;
  }): Promise<{ id: string; email: string }>;
  createProfile(data: {
    userId: string;
    fullName: string;
    phone: string;
  }): Promise<void>;
  findProfileImageByUserId(userId: string): Promise<{
    profileId: string;
    storageKey: string | null;
  } | null>;
  updateProfileImageKey(
    userId: string,
    storageKey: string,
  ): Promise<{ profileId: string; updatedAt: Date }>;
  findCustomerCredentialsByEmail(email: string): Promise<{
    userId: string;
    passwordHash: string;
  } | null>;
  findCustomerCredentialsByUserId(userId: string): Promise<{
    userId: string;
    passwordHash: string;
  } | null>;
  updatePasswordAndRevokeSessions(
    userId: string,
    passwordHash: string,
  ): Promise<void>;
}
