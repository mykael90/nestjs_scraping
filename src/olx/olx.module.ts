import { Module } from '@nestjs/common';
import { OlxService } from './olx.service';
import { OlxController } from './olx.controller';
import { ListingsModule } from './listings/listings.module';
import { LocationsModule } from './locations/locations.module';
import { HttpModule } from '@nestjs/axios';
import { GeocodeModule } from '../geocode/geocode.module';

@Module({
  controllers: [OlxController],
  providers: [OlxService],
  imports: [HttpModule, ListingsModule, LocationsModule, GeocodeModule],
})
export class OlxModule {}
