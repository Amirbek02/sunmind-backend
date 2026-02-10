import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { CustomLogger } from 'src/helpers/logger/logger.service';
import { ReviewEntity } from '../database/entities/review.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([ReviewEntity])],
  controllers: [ReviewController],
  providers: [ReviewService, CustomLogger],
  exports: [ReviewService],
})
export class ReviewModule {}
