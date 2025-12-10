import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('StackAuth API')
    .setDescription(
      'Backend API for Google OAuth authentication and Paystack payment integration. ' +
      'This API provides endpoints for user authentication via Google Sign-In and payment processing through Paystack.',
    )
    .setVersion('1.0')
    .addTag('auth', 'Google OAuth authentication endpoints')
    .addTag('payments', 'Paystack payment processing endpoints')
    .addTag('users', 'User management endpoints')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}

