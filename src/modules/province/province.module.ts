import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { ProvinceController } from './province.controller';
import { ProvinceService } from './province.service';

@Module({
  imports: [HttpModule],
  controllers: [ProvinceController],
  providers: [ProvinceService],
  exports: [ProvinceService],
})
export class ProvinceModule {}
