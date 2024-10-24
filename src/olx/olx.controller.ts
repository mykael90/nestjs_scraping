import {
  Controller,
  Get,
  Logger,
  Param,
  ParseEnumPipe,
  Put,
  Query,
} from '@nestjs/common';
import { OlxService } from './olx.service';
import { Neighbourhood } from './enum/neighbourhood.enum';
import { Types } from 'mongoose';

@Controller('olx')
export class OlxController {
  private readonly logger = new Logger(OlxController.name);
  private readonly entryPoint =
    'https://www.olx.com.br/imoveis/venda/casas/estado-rn/rio-grande-do-norte/natal';

  private readonly propertyEntryPoint =
    'https://rn.olx.com.br/rio-grande-do-norte/imoveis';

  constructor(private readonly olxService: OlxService) {}

  @Get('properties')
  showProperties(@Query('url') url: any) {
    this.logger.log(`param: ${url}`);
    return this.olxService.showProperties(url);
  }

  @Put('properties/all')
  update100Properties() {
    return this.olxService.update100ListingsProperties();
  }

  @Put('properties/:id')
  updateProperties(@Param('id') _id: Types.ObjectId) {
    return this.olxService.updateListingProperties(_id);
  }

  @Get('scrapingall')
  getListingsAll() {
    this.logger.log(`Getting all listings...`);
    return this.olxService.getListingsAll();
  }

  @Get(':param')
  showListings(@Param('param', new ParseEnumPipe(Neighbourhood)) param: any) {
    this.logger.log(`param: ${param}`);

    return this.olxService.showListings(param);
  }

  @Get('scraping/:param')
  getListings(@Param('param', new ParseEnumPipe(Neighbourhood)) param: any) {
    this.logger.log(`param: ${param}`);

    return this.olxService.getListings(param);
  }
}
