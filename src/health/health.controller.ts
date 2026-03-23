import { Controller, Get, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HealthCheck, HealthCheckService, MongooseHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly health: HealthCheckService,
    private readonly mongoose: MongooseHealthIndicator,
  ) {}

  @Get('live')
  @HealthCheck()
  live() {
    return this.health.check([]);
  }

  @Get('ready')
  @HealthCheck()
  async ready() {
    try {
      return await this.health.check([() => this.mongoose.pingCheck('mongo')]);
    } catch (err) {
      this.logger.warn('MongoDB not ready', err as Error);
      throw new HttpException(
        {
          status: 'error',
          info: {},
          error: {
            mongo: {
              status: 'down',
              message: 'MongoDB not reachable',
            },
          },
          details: {
            mongo: {
              status: 'down',
            },
          },
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
