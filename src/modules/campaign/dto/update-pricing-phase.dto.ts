import { PartialType } from '@nestjs/mapped-types';
import { CreatePricingPhaseDto } from './create-pricing-phase.dto';

export class UpdatePricingPhaseDto extends PartialType(CreatePricingPhaseDto) {}
