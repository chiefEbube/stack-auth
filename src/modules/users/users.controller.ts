import { Controller, Get, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { User } from './user.entity';
import { WalletService } from '../wallet/wallet.service';

@ApiTags('users')
@Controller('users')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly walletService: WalletService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of all users', type: [User] })
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User details', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}

