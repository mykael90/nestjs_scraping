import { Module } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';
import { LocationsModule } from '../locations/locations.module';

@Module({
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
  imports: [LocationsModule],
})
export class ListingsModule {}
