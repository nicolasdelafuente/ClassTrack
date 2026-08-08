import { Module } from '@nestjs/common';
import { SprintSheetsController } from './sprint-sheets.controller';
import { SprintSheetsService } from './sprint-sheets.service';

@Module({
  controllers: [SprintSheetsController],
  providers: [SprintSheetsService],
  exports: [SprintSheetsService],
})
export class SprintSheetsModule {}
