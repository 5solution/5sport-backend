import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

const PROVINCE_API_BASE = 'https://provinces.open-api.vn/api/v2';

@Injectable()
export class ProvinceService {
  private readonly logger = new Logger(ProvinceService.name);

  private provincesCache: any[] | null = null;
  private cacheTimestamp = 0;
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

  constructor(private readonly httpService: HttpService) {}

  async listProvinces(search?: string): Promise<any[]> {
    const provinces = await this.fetchProvinces();
    if (!search) return provinces;
    const q = search.toLowerCase();
    return provinces.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.codename.toLowerCase().includes(q),
    );
  }

  async getProvince(code: number, depth?: number): Promise<any> {
    const url = `${PROVINCE_API_BASE}/p/${code}${depth ? `?depth=${depth}` : ''}`;
    const { data } = await firstValueFrom(this.httpService.get(url));
    return data;
  }

  async listWards(provinceCode?: number, search?: string): Promise<any[]> {
    const params: Record<string, any> = {};
    if (provinceCode) params.province = provinceCode;
    if (search) params.search = search;

    const { data } = await firstValueFrom(
      this.httpService.get(`${PROVINCE_API_BASE}/w/`, { params }),
    );
    return data;
  }

  async getWard(code: number): Promise<any> {
    const { data } = await firstValueFrom(
      this.httpService.get(`${PROVINCE_API_BASE}/w/${code}`),
    );
    return data;
  }

  private async fetchProvinces(): Promise<any[]> {
    const now = Date.now();
    if (this.provincesCache && now - this.cacheTimestamp < this.CACHE_TTL) {
      return this.provincesCache;
    }

    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${PROVINCE_API_BASE}/p/`),
      );
      this.provincesCache = data;
      this.cacheTimestamp = now;
      return data;
    } catch (error) {
      this.logger.error('Failed to fetch provinces', error);
      return this.provincesCache || [];
    }
  }
}
