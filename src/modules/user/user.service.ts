import { UserProfile } from "./user.model";

export class UserService {
  async getUserByEmail(email: string) {
    return await UserProfile.findOne({ email });
  }

  async createUser(data: any) {
    return await UserProfile.create(data);
  }
}
