import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PRODUCTS_UPLOAD_DIR } from '../../upload-paths';
import { JwtAuthGuard } from '../sessions/guards/jwt-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

const productImageInterceptor = FileInterceptor('image', {
  storage: diskStorage({
    destination: PRODUCTS_UPLOAD_DIR,
    filename: (
      req: Express.Request,
      file: Express.Multer.File,
      cb: (error: Error | null, filename: string) => void,
    ) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
    },
  }),
  fileFilter: (
    req: Express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, accepted: boolean) => void,
  ) => {
    if (!file.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async list(
    @Request() req: { user: { userId: string } },
    @Query() query: ListProductsQueryDto,
  ) {
    return this.productsService.listForUser(req.user.userId, query);
  }

  @Get(':id')
  async getById(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.productsService.getByIdForUser(req.user.userId, id);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(productImageInterceptor)
  async create(
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.productsService.createForUser(
      req.user.userId,
      dto,
      file ? `/uploads/products/${file.filename}` : undefined,
    );
  }

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(productImageInterceptor)
  async update(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.productsService.updateForUser(
      req.user.userId,
      id,
      dto,
      file ? `/uploads/products/${file.filename}` : undefined,
    );
  }

  @Delete(':id')
  async remove(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    await this.productsService.deleteForUser(req.user.userId, id);
    return { message: 'Product deleted successfully' };
  }
}
