import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
    constructor(private usersService: UsersService){}

    async googleLogin(user: any) {
        if (!user) return 'No user from google';

        const existingUser = await this.usersService.findOrCreate(user);

        return{
            message: 'User information from Google',
            user: existingUser,
        }
    }
}
