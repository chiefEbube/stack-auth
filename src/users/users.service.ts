import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async findOrCreate(profile: any): Promise<User> {
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
}
