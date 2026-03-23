import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProductsService } from './products.service';
import { CreateProductDto } from '../transport/http/products/create-product.dto';
import { UpdateProductDto } from '../transport/http/products/update-product.dto';
import { ProductResponseDto } from '../transport/http/products/product-response.dto';
import { SearchProductsDto } from '../transport/http/products/search-products.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user.schema';
import * as sharp from 'sharp';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.User)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  private async validateImage(file?: any) {
    if (!file) {
      throw new BadRequestException('picture file is required');
    }
    const metadata = await sharp(file.buffer).metadata();
    if (!metadata.width || !metadata.height) {
      throw new BadRequestException('Invalid image');
    }
    if (metadata.width > 1024 || metadata.height > 1024) {
      throw new BadRequestException('Image exceeds 1024x1024');
    }
  }

  private buildPictureUrl(sku: string) {
    return `s3.amazonaws.com/bucket/product_${sku}`;
  }

  @Get()
  @ApiOperation({ summary: 'List products (authenticated user)' })
  @ApiQuery({ name: 'page', required: false, example: '' })
  @ApiQuery({ name: 'limit', required: false, example: '' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'sku', 'price', 'createdAt'], example: '' })
  @ApiQuery({ name: 'sortDir', required: false, enum: ['asc', 'desc'], example: '' })
  @ApiQuery({ name: 'name', required: false, example: '' })
  @ApiQuery({ name: 'nameContains', required: false, example: '' })
  @ApiQuery({ name: 'sku', required: false, example: '' })
  @ApiQuery({ name: 'price', required: false, example: '' })
  @ApiQuery({ name: 'minPrice', required: false, example: '' })
  @ApiQuery({ name: 'maxPrice', required: false, example: '' })
  @ApiResponse({ status: 200, description: 'List of products', type: ProductResponseDto, isArray: true })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  list(@Query() query?: SearchProductsDto) {
    return this.productsService.listProducts(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by id (authenticated user)' })
  @ApiResponse({ status: 200, description: 'Product', type: ProductResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getById(@Param('id') id: string) {
    return this.productsService.getById(id);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateProductDto })
  @UseInterceptors(FileInterceptor('picture', { storage: memoryStorage() }))
  @ApiOperation({ summary: 'Create product (authenticated user)' })
  @ApiResponse({ status: 201, description: 'Product created', type: ProductResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(@Body() dto: CreateProductDto, @UploadedFile() file?: any) {
    await this.validateImage(file);
    return this.productsService.createProduct({
      name: dto.name,
      sku: dto.sku,
      pictureUrl: this.buildPictureUrl(dto.sku),
      price: dto.price,
    });
  }

  @Put(':id')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateProductDto })
  @UseInterceptors(FileInterceptor('picture', { storage: memoryStorage() }))
  @ApiOperation({
    summary: 'Update product by id (authenticated user)',
    description: 'Only provided fields are updated. Empty strings are treated as not provided.',
  })
  @ApiResponse({ status: 200, description: 'Product updated', type: ProductResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFile() file?: any,
  ) {
    if (file) {
      await this.validateImage(file);
    }
    let pictureUrl: string | undefined;
    if (file) {
      if (dto.sku) {
        pictureUrl = this.buildPictureUrl(dto.sku);
      } else {
        const existing = await this.productsService.getById(id);
        pictureUrl = this.buildPictureUrl(existing.sku);
      }
    } else if (dto.sku) {
      pictureUrl = this.buildPictureUrl(dto.sku);
    }
    return this.productsService.updateById(id, {
      name: dto.name,
      sku: dto.sku,
      pictureUrl,
      price: dto.price,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product by id (authenticated user)' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    await this.productsService.deleteById(id);
  }
}
