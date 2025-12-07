import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { GoogleUserProfile } from 'src/auth/types/google-profile.interface';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async findOrCreate(profile: GoogleUserProfile): Promise<User> {
        const { email, name, picture, sub } = profile;

        let user = await this.usersRepository.findOne({ where: { email } });

        if (user) {
            if (!user.googleId) {
                user.googleId = sub;
                await this.usersRepository.save(user);
            }

            return user;
        }

        user = this.usersRepository.create({
            email,
            name,
            profilePicture: picture,
            googleId: sub,
        });

        return this.usersRepository.save(user);
    }

    async findOne(id: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { id } });
    }

    async findAll(): Promise<User[]> {
        return this.usersRepository.find();
    }
}
