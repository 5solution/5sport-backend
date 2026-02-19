import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Province } from './entities/province.entity';
import { Ward } from './entities/ward.entity';

@Injectable()
export class ProvinceService {
  constructor(
    @InjectRepository(Province)
    private readonly provinceRepo: Repository<Province>,
    @InjectRepository(Ward)
    private readonly wardRepo: Repository<Ward>,
  ) {}

  async listProvinces(search?: string): Promise<Province[]> {
    if (!search) {
      return this.provinceRepo.find({ order: { code: 'ASC' } });
    }
    return this.provinceRepo.find({
      where: [
        { name: ILike(`%${search}%`) },
        { codename: ILike(`%${search}%`) },
      ],
      order: { code: 'ASC' },
    });
  }

  async getProvince(code: number, depth?: number): Promise<Province> {
    const relations = depth && depth >= 2 ? ['wards'] : [];
    const province = await this.provinceRepo.findOne({
      where: { code },
      relations,
    });
    if (!province) {
      throw new NotFoundException(`Province with code ${code} not found`);
    }
    return province;
  }

  async listWards(provinceCode?: number, search?: string): Promise<Ward[]> {
    const where: any = {};
    if (provinceCode) where.province_code = provinceCode;
    if (search) {
      return this.wardRepo.find({
        where: [
          { ...where, name: ILike(`%${search}%`) },
          { ...where, codename: ILike(`%${search}%`) },
        ],
        order: { code: 'ASC' },
      });
    }
    return this.wardRepo.find({ where, order: { code: 'ASC' } });
  }

  async getWard(code: number): Promise<Ward> {
    const ward = await this.wardRepo.findOne({ where: { code } });
    if (!ward) {
      throw new NotFoundException(`Ward with code ${code} not found`);
    }
    return ward;
  }
}
