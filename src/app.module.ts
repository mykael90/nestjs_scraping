import { Module } from '@nestjs/common';
import { OlxModule } from './olx/olx.module';
import { PuppeteerModule } from './puppeteer/puppeteer.module';
import { ConfigModule } from '@nestjs/config';
import { MongoModule } from './mongo/mongo.module';
import { GeocodeModule } from './geocode/geocode.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongoModule,
    PuppeteerModule,
    OlxModule,
    GeocodeModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
