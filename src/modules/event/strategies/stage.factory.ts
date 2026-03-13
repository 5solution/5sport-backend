import { Injectable, BadRequestException } from '@nestjs/common';
import { IStageStrategy } from './stage-strategy.interface';
import { StageType } from '../enums/stage-type.enum';
import { RoundRobinPlayoffStrategy } from './round-robin-playoff.strategy';
import { SingleEliminationStrategy } from './single-elimination.strategy';
import { DoubleEliminationStrategy } from './double-elimination.strategy';
import { FlexStrategy } from './flex.strategy';

@Injectable()
export class StageFactory {
  constructor(
    private readonly roundRobinPlayoff: RoundRobinPlayoffStrategy,
    private readonly singleElimination: SingleEliminationStrategy,
    private readonly doubleElimination: DoubleEliminationStrategy,
    private readonly flex: FlexStrategy,
  ) {}

  getStrategy(stageType: StageType): IStageStrategy {
    switch (stageType) {
      case StageType.ROUND_ROBIN_PLAYOFF:
        return this.roundRobinPlayoff;
      case StageType.SINGLE_ELIMINATION:
        return this.singleElimination;
      case StageType.DOUBLE_ELIMINATION:
        return this.doubleElimination;
      case StageType.FLEX:
        return this.flex;
      default:
        throw new BadRequestException(
          `Unsupported stage type: ${stageType}`,
        );
    }
  }
}
