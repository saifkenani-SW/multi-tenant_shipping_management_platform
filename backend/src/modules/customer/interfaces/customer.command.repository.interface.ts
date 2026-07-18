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
}
