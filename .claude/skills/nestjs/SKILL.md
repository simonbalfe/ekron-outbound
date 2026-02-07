---
name: nestjs
description: NestJS clean code conventions and architecture patterns. Use when writing, reviewing, or refactoring NestJS code including modules, controllers, services, DTOs, guards, interceptors, and pipes.
---

You are an expert NestJS developer. When writing or reviewing NestJS code, strictly follow these principles:

## Architecture

- Follow NestJS module-based architecture: each feature gets its own module, controller, service, and DTOs
- Keep controllers thin — they should only handle HTTP concerns (parsing input, returning responses). All business logic belongs in services
- Use dependency injection everywhere. Never instantiate services manually with `new`
- Organize by feature, not by type. Group related files together (e.g., `users/users.controller.ts`, `users/users.service.ts`, `users/dto/create-user.dto.ts`)
- If a service, type, or utility is shared across multiple modules, place it in a `common/` directory

## TypeScript & Type Safety

- Never use `any`. Define proper interfaces, types, and DTOs for everything
- Use `class-validator` decorators on DTOs for runtime validation
- Use `class-transformer` for transforming plain objects to class instances
- Use strict return types on all service methods and controller handlers
- Prefer enums or union types over magic strings

## Services

- One responsibility per service — if a service is doing too many things, split it
- Services should be stateless. Do not store request-scoped data in service properties
- Throw NestJS built-in HTTP exceptions (`NotFoundException`, `BadRequestException`, etc.) or custom exceptions that extend them
- Keep service methods focused and small. Extract helper logic into private methods or separate utility services

## Controllers

- Use appropriate HTTP method decorators (`@Get`, `@Post`, `@Put`, `@Patch`, `@Delete`)
- Always use DTOs with `@Body()`, `@Query()`, and `@Param()` — never accept raw untyped objects
- Use `@HttpCode()` when the default status code doesn't match the operation
- Use `@UsePipes(ValidationPipe)` or set it globally for automatic DTO validation
- Return consistent response shapes

## Modules

- Each module should declare its own providers and controllers
- Export only what other modules need — keep internal services private
- Use `forRoot()` / `forRootAsync()` patterns for configurable modules
- Use `@Global()` sparingly — only for truly cross-cutting concerns like config or logging

## Error Handling

- Use NestJS exception filters for consistent error responses
- Create custom exception classes that extend `HttpException` when built-in exceptions are insufficient
- Never swallow errors silently — always log or rethrow

## Configuration

- Use `@nestjs/config` with `ConfigService` for environment variables
- Validate env variables at startup using a schema (Joi or class-validator)
- Never hardcode secrets or environment-specific values

## Guards, Interceptors & Pipes

- Use guards for authentication and authorization
- Use interceptors for cross-cutting concerns (logging, response transformation, caching)
- Use pipes for input transformation and validation
- Apply decorators at the narrowest scope possible (method > controller > global)

## Database & ORM

- Use repository pattern — never query the database directly from controllers
- Keep entity definitions clean and separate from DTOs
- Use transactions for operations that modify multiple records
- Use migrations, not `synchronize: true` in production

## Testing

- Write unit tests for services with mocked dependencies
- Write e2e tests for controller endpoints
- Use `Test.createTestingModule()` for proper NestJS testing context
- Mock external dependencies (databases, APIs) in unit tests

## Clean Code Rules

- Never write comments in code
- Keep code simple and readable — no clever hacks
- Follow SOLID, DRY, and KISS principles
- If a file grows too large, separate concerns into multiple files
- Do not install packages or run commands — list what needs to be installed at the end

Apply all of these rules when writing, reviewing, or refactoring NestJS code in this project. $ARGUMENTS
