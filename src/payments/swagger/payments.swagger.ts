import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiHeader,
  ApiTags,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  InitiatePaymentResponseDto,
  TransactionStatusResponseDto,
  WebhookResponseDto,
} from 'src/common/dto/api-response.dto';
import { InitiatePaymentDto } from 'src/payments/dto/initiate-payment.dto';

export const ApiInitiatePayment = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Initiate Paystack payment',
      description:
        'Initializes a new payment transaction with Paystack. Requires JWT authentication. ' +
        'Validates the authenticated user and amount, calls Paystack to create a transaction, ' +
        'and returns the authorization URL for payment.',
    }),
    ApiBody({
      type: InitiatePaymentDto,
      description: 'Payment initiation request',
    }),
    ApiResponse({
      status: 201,
      description: 'Payment initialized successfully',
      type: InitiatePaymentResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - invalid input',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 400 },
          message: { 
            type: 'string', 
            example: 'Invalid amount. Amount must be a positive integer in Kobo' 
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - JWT token required',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 401 },
          message: { 
            type: 'string', 
            example: 'Unauthorized' 
          },
        },
      },
    }),
    ApiResponse({
      status: 402,
      description: 'Payment initiation failed by Paystack',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 402 },
          message: { type: 'string', example: 'Payment initiation failed' },
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
          message: { type: 'string', example: 'Payment initialization failed' },
        },
      },
    }),
  );

export const ApiWebhook = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Paystack webhook endpoint',
      description:
        'Receives transaction updates from Paystack. Validates the webhook signature, ' +
        'parses the event payload, and updates the transaction status in the database.',
    }),
    ApiHeader({
      name: 'x-paystack-signature',
      description: 'HMAC SHA512 signature of the webhook payload',
      required: true,
      example: 'sha512=abc123...',
    }),
    ApiResponse({
      status: 200,
      description: 'Webhook processed successfully',
      type: WebhookResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - invalid signature',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 400 },
          message: { type: 'string', example: 'Invalid signature' },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - no signature provided',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 401 },
          message: { type: 'string', example: 'No signature provided' },
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
          message: { type: 'string', example: 'Server error' },
        },
      },
    }),
  );

export const ApiCheckStatus = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Check transaction status',
      description:
        'Returns the latest transaction status. If refresh=true is provided or the transaction is pending, ' +
        'fetches the live status from Paystack and updates the database.',
    }),
    ApiParam({
      name: 'reference',
      description: 'Transaction reference',
      example: 'T1234567890',
    }),
    ApiQuery({
      name: 'refresh',
      description: 'Force refresh from Paystack API',
      required: false,
      type: String,
      example: 'true',
    }),
    ApiResponse({
      status: 200,
      description: 'Transaction status retrieved successfully',
      type: TransactionStatusResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - transaction not found',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 400 },
          message: { type: 'string', example: 'Transaction not found' },
        },
      },
    }),
  );

