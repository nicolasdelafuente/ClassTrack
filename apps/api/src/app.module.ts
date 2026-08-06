import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CoursesModule } from './courses/courses.module';
import { GroupsModule } from './groups/groups.module';

@Module({
  imports: [PrismaModule, CoursesModule, GroupsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
