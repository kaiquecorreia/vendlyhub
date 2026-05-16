import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../sessions/guards/jwt-auth.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async list(@Request() req: { user: { userId: string } }) {
    return this.categoriesService.listForUser(req.user.userId);
  }

  @Post()
  async create(
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.createForUser(req.user.userId, dto);
  }

  @Patch(':id')
  async update(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.updateForUser(req.user.userId, id, dto);
  }

  @Delete(':id')
  async remove(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    await this.categoriesService.deleteForUser(req.user.userId, id);
    return { message: 'Category deleted successfully' };
  }
}
