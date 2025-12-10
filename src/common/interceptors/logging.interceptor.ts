import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = request;
    const now = Date.now();

    // Don't log sensitive data
    const sanitizedBody = this.sanitizeBody(body);
    const sanitizedQuery = this.sanitizeQuery(query);

    this.logger.log(
      `${method} ${url} - Query: ${JSON.stringify(sanitizedQuery)} - Body: ${JSON.stringify(sanitizedBody)}`,
    );

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const { statusCode } = response;
        const delay = Date.now() - now;
        this.logger.log(
          `${method} ${url} ${statusCode} - ${delay}ms`,
        );
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'secret', 'key', 'token', 'apiKey'];
    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });
    return sanitized;
  }

  private sanitizeQuery(query: any): any {
    if (!query) return query;
    const sanitized = { ...query };
    if (sanitized.api_key) {
      sanitized.api_key = '***REDACTED***';
    }
    return sanitized;
  }
}
