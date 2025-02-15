import { register } from '../service/auth.service';
import { Role } from '@eduflow/prisma';
import * as userRepo from '../repository/user.repository';

jest.mock('../repository/user.repository');

describe('Auth Service', () => {
  describe('register', () => {
    const registerInput = {
      email: 'test@example.com',
      password: 'Password123!',
      roles: [Role.TEACHER],
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should register a new user successfully', async () => {
      (userRepo.findUserByEmail as jest.Mock).mockResolvedValue(null);
      (userRepo.createUser as jest.Mock).mockResolvedValue({
        id: '123',
        ...registerInput,
      });

      const result = await register(registerInput)();
      expect(result._tag).toBe('Right');
    });

    it('should return error if email already exists', async () => {
      (userRepo.findUserByEmail as jest.Mock).mockResolvedValue({
        id: '123',
        email: registerInput.email,
      });

      const result = await register(registerInput)();
      expect(result._tag).toBe('Left');
    });
  });
});
