import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './swagger/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  setupSwagger(app);
  
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  
  console.log(`Server is running on: http://localhost:${port}`);
  console.log(`Swagger documentation available at: http://localhost:${port}/docs\n`);
}
bootstrap();
