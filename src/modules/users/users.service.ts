import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { WalletService } from '../wallet/wallet.service';

interface GoogleUserProfile {
  email: string;
  name: string;
  avatar?: string;
  googleId: string;
}

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    private walletService: WalletService,
  ) {}

    async findOrCreate(profile: GoogleUserProfile): Promise<User> {
    const { email, name, avatar, googleId } = profile;

        let user = await this.usersRepository.findOne({ where: { email } });

        if (user) {
            if (!user.googleId) {
        user.googleId = googleId;
        await this.usersRepository.save(user);
      }
      if (avatar && !user.avatar) {
        user.avatar = avatar;
                await this.usersRepository.save(user);
            }

      // Ensure wallet exists
      try {
        await this.walletService.getWalletByUserId(user.id);
      } catch {
        await this.walletService.createWallet(user.id);
      }

            return user;
        }

    // Create new user
        user = this.usersRepository.create({
            email,
            name,
      avatar,
      googleId,
        });

    const savedUser = await this.usersRepository.save(user);

    // Create wallet automatically
    await this.walletService.createWallet(savedUser.id);

    return savedUser;
    }

    async findOne(id: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { id } });
    }

    async findAll(): Promise<User[]> {
        return this.usersRepository.find();
    }
}
