import { Module } from '@nestjs/common';
import { GroupNotesController } from './group-notes.controller';
import { GroupNotesService } from './group-notes.service';

@Module({
  controllers: [GroupNotesController],
  providers: [GroupNotesService],
})
export class GroupNotesModule {}
