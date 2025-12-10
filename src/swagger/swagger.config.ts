import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('StackAuth API')
    .setDescription(
      'Wallet Service with Paystack, JWT & API Keys.\n'
    )
    .setVersion('1.0')
    .addTag('auth', 'Google OAuth authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('wallet', 'Wallet operations (deposit, transfer, balance, transactions)')
    .addTag('api-keys', 'API key management')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT or API Key',
        name: 'Authorization',
        description: 'Enter JWT token or API key',
        in: 'header',
      },
      'auth-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}

