import { Module } from '@nestjs/common';
import { GeocodeService } from './geocode.service';
import { GeocodeController } from './geocode.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  controllers: [GeocodeController],
  providers: [GeocodeService],
  imports: [HttpModule],
  exports: [GeocodeService],
})
export class GeocodeModule {}
