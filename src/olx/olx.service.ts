import { Injectable, Logger } from '@nestjs/common';
import { PuppeteerService } from '../puppeteer/puppeteer.service';
import { ListingsService } from './listings/listings.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Listing } from './listings/entities/listing.entity';
import { Neighbourhood } from './enum/neighbourhood.enum';
import { LocationsService } from './locations/locations.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GeocodeService } from '../geocode/geocode.service';

@Injectable()
export class OlxService {
  private readonly entryPoint =
    'https://www.olx.com.br/imoveis/venda/casas/estado-rn/rio-grande-do-norte/natal';
  private readonly logger = new Logger(OlxService.name);

  constructor(
    private readonly puppeteerService: PuppeteerService,
    private readonly listingsService: ListingsService,
    @InjectModel('Listing') private readonly listingModel: Model<Listing>,
    private readonly locationService: LocationsService,
    private readonly httpService: HttpService,
    private readonly geocodeService: GeocodeService,
  ) {}
  async showListings(param: string) {
    const url = `${this.entryPoint}/${param}`;
    const browser = await this.puppeteerService.launchBrowser();
    const page = await browser.newPage();

    // Definir um User-Agent realista para evitar blocks
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
    );

    try {
      await page.goto(url, {
        waitUntil: 'networkidle2', // Aguarda até que não haja mais requisições de rede em andamento
        timeout: 60000, // Aumenta o tempo limite para 60 segundos
      });

      // Captura de tela para verificar o estado da página
      // await page.screenshot({ path: 'screenshot.png', fullPage: true });

      const pageTitle = await page.title();
      this.logger.log(
        `Scraping job listings on url: ${url} - title: ${pageTitle}`,
      );

      if (
        pageTitle.includes('não encontrado') ||
        pageTitle.includes('Attention Required')
      ) {
        return false;
      }

      // await page.waitForSelector('script[id="__NEXT_DATA__"]', {
      //   timeout: 30 * 1000,
      // }); // Aguarda o script __NEXT_DATA__

      await page.locator('#__NEXT_DATA__').wait();

      const dataElement = await page.$('#__NEXT_DATA__');

      // const props = await page.evaluate(() => {
      //   return (window as any).__NEXT_DATA__.props.pageProps;
      // });

      const props = await page.evaluate((element: any) => {
        const json = element.textContent;
        return JSON.parse(json).props.pageProps;
      }, dataElement);

      const totalOfAds = props.totalOfAds;

      const numberOfPages = Math.ceil(totalOfAds / 50);

      const ads = props.ads.filter((ad: any) => ad.subject);

      // Get all pages
      for (let i = 2; i <= numberOfPages; i++) {
        await page.goto(`${url}?o=${i}`, {
          waitUntil: 'networkidle2', // Aguarda até que não haja mais requisições de rede em andamento
          timeout: 60000, // Aumenta o tempo limite para 60 segundos
        });

        // await page.waitForSelector('script[id="__NEXT_DATA__"]', {
        //   timeout: 10 * 1000,
        // }); // Aguarda o script __NEXT_DATA__
        // const props = await page.evaluate(() => {
        //   return (window as any).__NEXT_DATA__.props.pageProps;
        // });

        await page.locator('#__NEXT_DATA__').wait();

        const dataElement = await page.$('#__NEXT_DATA__');
        const props = await page.evaluate((element: any) => {
          const json = element.textContent;
          return JSON.parse(json).props.pageProps;
        }, dataElement);

        ads.push(...props.ads.filter((ad: any) => ad.subject));
      }

      this.logger.log(
        `totalOfAds ${totalOfAds}`,
        `numberOfPages ${numberOfPages}`,
        `adsLength ${ads.length}`,
      );

      const location = await this.locationService.findOneByNeighborhood(param);

      return { totalOfAds, numberOfPages, ads, location };
    } catch (error) {
      console.error('Error while scraping job listings:', error);
    } finally {
      await browser.close();
    }
  }

  async getListings(param: string) {
    const listings = await this.showListings(param);

    if (!listings) {
      return;
    }

    const locationId = new Types.ObjectId(listings.location?._id);

    const { ads } = listings;

    this.logger.log(`Ads length: ${ads.length}`);
    // this.logger.log(ads.map((ad: any) => ad.listId.toString()));

    // Busca os registros da localização
    const dbAds = await this.listingModel
      .find()
      .where('locationId')
      .in([locationId]);
    // .where('deletedAt')
    // .equals(null);

    this.logger.log(`dbAds length: ${dbAds.length}`);
    // this.logger.log(dbAds.map((dbAd: any) => dbAd.listId.toString()));

    //verifica se ads estão no banco
    const newAds: Listing[] = ads.filter(
      (ad: any) =>
        !dbAds.find(
          (dbAd: Listing) => dbAd.listId.toString() === ad.listId.toString(),
        ),
    );

    //verifica se está no banco e não está mais anunciada
    const deleteAds: Listing[] = dbAds.filter(
      (dbAd) =>
        !ads.find(
          (ad: Listing) => dbAd.listId.toString() === ad.listId.toString(),
        ),
    );

    this.logger.log(`newAds Length: ${newAds.length}`);

    //soft delete para os que não estão mais anunciados
    if (deleteAds.length > 0) {
      for (const deletAd of deleteAds) {
        await this.listingsService.update(deletAd._id, {
          deletedAt: new Date(),
        });
      }
    }

    this.logger.log(`deleteAds Length: ${deleteAds.length}`);

    // Atualiza ou insere novos anúncios
    if (newAds.length > 0) {
      // Transforma a data e adiciona o locationId
      newAds.forEach((ad: any) => {
        ad.date = new Date(ad.date * 1000);
        ad.locationId = locationId;
      });

      const bulkOperations = newAds.map((ad) => ({
        updateOne: {
          filter: { listId: ad.listId }, // Atualiza pelo campo único `listId`
          update: { $set: ad }, // Define os novos valores
          upsert: true, // Se não existir, cria o novo anúncio
        },
      }));

      // Executa a operação em lote
      await this.listingModel.bulkWrite(bulkOperations);
    }

    return `Processed ${newAds.length} new or updated ads and ${deleteAds.length} deleted ads.`;
  }

  async getListingsAll() {
    this.logger.log(`Getting all listings...`);
    const neighbourhoods = Object.values(Neighbourhood);

    for (const neighbourhood of neighbourhoods) {
      this.logger.log(`Getting listings from: ${neighbourhood}`);
      await this.getListings(neighbourhood);

      await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
    }

    return 'All listings done';
  }

  async showProperties(url: string) {
    const browser = await this.puppeteerService.launchBrowser();
    const page = await browser.newPage();

    // Definir um User-Agent realista para evitar blocks
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
    );

    try {
      await page.goto(url, {
        waitUntil: 'networkidle2', // Aguarda até que não haja mais requisições de rede em andamento
        timeout: 60000, // Aumenta o tempo limite para 60 segundos
      });

      const pageTitle = await page.title();
      this.logger.log(
        `Scraping job listings on url: ${url} - title: ${pageTitle}`,
      );

      if (
        pageTitle.includes('não encontrado') ||
        pageTitle.includes('Attention Required')
      ) {
        return false;
      }

      // Captura de tela para verificar o estado da página
      // await page.screenshot({ path: 'screenshot.png', fullPage: true });

      // Localiza o elemento pelo ID e aguarda está disponível
      await page.locator('#initial-data').wait();

      const dataElement = await page.$('#initial-data');

      const data = await page.evaluate(
        (element) => element.getAttribute('data-json'),
        dataElement,
      ); // Obtenha o atributo desejado

      // Transformar o JSON em um objeto JavaScript e retornar apenas a chave ad
      const ad = JSON.parse(data).ad;

      return ad;
    } catch (error) {
      console.error(`Error while scraping job listings on url: ${url}`, error);
    } finally {
      await browser.close();
    }
  }

  async updateListingProperties(_id: Types.ObjectId) {
    const listing = await this.listingsService.findOne(_id);
    const url = listing.url;

    if (!url) {
      return;
    }

    const ad = await this.showProperties(url);

    if (!ad) {
      listing.deletedAt = new Date();
      return await listing.save();
    }

    listing.locationDetails = { ...listing.locationDetails, ...ad.location };

    listing.phone = ad.phone;

    listing.user = ad.user;

    //update coordinates
    try {
      const { address, neighbourhood, municipality, uf } = ad.location;

      const addressParsed = address
        ? address.split(' - ')[0].split('(')[0] + ','
        : '';

      const q = `${addressParsed} ${neighbourhood}, ${municipality}, ${uf}`;

      //se não por pela radarAPI, pesquisar pelo mapsAPI (mapsAPI é melhor, mas tem mais restrições para o plano gratuito)

      const data = address
        ? (await this.geocodeService.geocodeRadar(q)) ||
          (await this.geocodeService.geocodeMaps(q))
        : await this.geocodeService.geocodeMaps(q);

      if (data) {
        listing.locationDetails = {
          ...listing.locationDetails,
          ...data,
        };
      }
    } catch (error) {
      console.error(error);
    }

    return await listing.save();
  }

  async update100ListingsProperties() {
    const listings = await this.listingModel
      .find()
      .where('deletedAt')
      .equals(null)
      .where('locationDetails.streetCoordinates')
      .exists(false)
      .limit(1000);

    for (const listing of listings) {
      await this.updateListingProperties(listing._id);
    }

    return 'done';
  }
}
