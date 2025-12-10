import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { GoogleAuthUrlResponseDto, GoogleCallbackResponseDto } from 'src/common/dto/api-response.dto';

export const ApiGoogleAuth = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Trigger Google sign-in flow',
      description:
        'Returns the Google OAuth authorization URL. The user should be redirected to this URL to initiate the Google sign-in process.',
    }),
    ApiResponse({
      status: 200,
      description: 'Google OAuth URL returned successfully',
      type: GoogleAuthUrlResponseDto,
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 500 },
          message: { type: 'string', example: 'Failed to generate Google auth URL' },
        },
      },
    }),
  );

export const ApiGoogleCallback = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Google OAuth callback',
      description:
        'Handles the callback from Google OAuth. Exchanges the authorization code for an access token, ' +
        'fetches user information from Google, and creates or updates the user in the database.',
    }),
    ApiQuery({
      name: 'code',
      description: 'Authorization code from Google',
      required: true,
      example: '4/0AeanS...',
    }),
    ApiQuery({
      name: 'state',
      description: 'State parameter for CSRF protection',
      required: true,
      example: 'abc123def456',
    }),
    ApiQuery({
      name: 'error',
      description: 'Error code from Google (if authentication failed)',
      required: false,
      example: 'access_denied',
    }),
    ApiResponse({
      status: 200,
      description: 'User authenticated successfully',
      type: GoogleCallbackResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - missing code or OAuth error',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 400 },
          message: { type: 'string', example: 'Missing authorization code' },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - invalid authorization code or state',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 401 },
          message: { type: 'string', example: 'Invalid state parameter' },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 500 },
          message: { type: 'string', example: 'Provider error' },
        },
      },
    }),
  );

