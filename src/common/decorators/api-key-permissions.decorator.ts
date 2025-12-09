import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const ApiKeyPermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
