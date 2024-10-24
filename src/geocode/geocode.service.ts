import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { set } from 'mongoose';

type Limits = {
  lat: { inf: number; sup: number };
  lng: { inf: number; sup: number };
};

const limitsNatal: Limits = {
  lat: { inf: -5.9, sup: -5.7 },
  lng: { inf: -35.32, sup: -35.16 },
};

@Injectable()
export class GeocodeService {
  private readonly logger = new Logger(GeocodeService.name);

  constructor(private readonly httpService: HttpService) {}

  isInsideLimits(lat: number = 0, lng: number = 0, limits: Limits) {
    return (
      lat >= limits.lat.inf &&
      lat <= limits.lat.sup &&
      lng >= limits.lng.inf &&
      lng <= limits.lng.sup
    );
  }

  async geocodeMaps(q: string) {
    const params = {
      api_key: process.env.GEOCODE_MAPS_API_KEY,
      q,
    };
    const { data } = await firstValueFrom(
      this.httpService.get(`https://geocode.maps.co/search`, {
        params,
      }),
    );

    const isInside = this.isInsideLimits(
      data[0]?.lat,
      data[0]?.lon,
      limitsNatal,
    );

    // se não encontrar o endereço ou estiver fora dos limites, pesquisar pelo bairro
    if (data.length === 0 || !isInside) {
      // pesquisando apenas pelo bairro, deixando menos rígida
      params.q = q.split(',').slice(1).toString().trim();

      // aguardar mais de 1 segundo para fazer requisições em sequência nessa API
      await new Promise((resolve) => setTimeout(resolve, 1.2 * 1000));

      const { data } = await firstValueFrom(
        this.httpService.get(`https://geocode.maps.co/search`, {
          params,
        }),
      );

      const isInside = this.isInsideLimits(
        data[0]?.lat,
        data[0]?.lon,
        limitsNatal,
      );

      // se não encontrar o bairro ou estiver fora dos limites retornar false
      if (data.length === 0 || !isInside) {
        this.logger.log(`Endereço ${q} não encontrado`);
        return false;
      }

      return {
        mapLati: data[0].lat,
        mapLong: data[0].lon,
        streetCoordinates: false,
      };
    }

    return {
      mapLati: data[0].lat,
      mapLong: data[0].lon,
      streetCoordinates: data[0].type !== 'administrative',
    };
  }

  async geocodeRadar(q: string) {
    const params = {
      query: q.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      country: 'BR',
    };
    const { data } = await firstValueFrom(
      this.httpService.get(`https://api.radar.io/v1/geocode/forward`, {
        params,
        headers: {
          Authorization: process.env.GEOCODE_RADAR_API_KEY,
        },
      }),
    );

    if (
      data.addresses.length === 0 ||
      !data.addresses[0].street ||
      data.addresses[0].city !== 'Natal'
    ) {
      this.logger.log(`Endereço ${q} não encontrado`);
      return false;
    }

    const isInside = this.isInsideLimits(
      data.addresses[0]?.latitude,
      data.addresses[0]?.longitude,
      limitsNatal,
    );

    if (!isInside) {
      this.logger.log(`Endereço ${q} fora do limite`);
      return false;
    }

    return {
      mapLati: data.addresses[0].latitude,
      mapLong: data.addresses[0].longitude,
      streetCoordinates: true,
    };
  }
}
