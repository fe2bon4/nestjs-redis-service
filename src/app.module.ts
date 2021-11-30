import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NodeModule } from './node/node.module';

@Module({
  imports: [NodeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
