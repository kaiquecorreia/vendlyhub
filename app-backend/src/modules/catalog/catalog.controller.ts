import { Controller, Get, Param } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get(':slug')
  async getCatalog(@Param('slug') slug: string) {
    return this.catalogService.getCatalog(slug);
  }

  @Get(':slug/highlighted')
  async getHighlighted(@Param('slug') slug: string) {
    return this.catalogService.getHighlightedProducts(slug);
  }
}
