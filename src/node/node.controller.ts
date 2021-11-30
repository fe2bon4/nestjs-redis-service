import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { NodeService } from './node.service';
import { CreateNodeDto } from './dto/create-node.dto';
import { UpdateNodeDto } from './dto/update-node.dto';
import { CreateDatabaseDto } from './dto/create-database.dto';
import { CreateTable } from './dto/create-table.dto';

@Controller('node')
export class NodeController {
  constructor(private readonly nodeService: NodeService) {}

  @Post('/database')
  createDatabase(@Body() createDatabaseDto: CreateDatabaseDto) {
    return this.nodeService.createDatabase(
      createDatabaseDto.database,
      createDatabaseDto.options,
    );
  }

  @Post('/table')
  createTable(@Body() createTableDto: CreateTable) {
    return this.nodeService.createTable(
      createTableDto.database,
      createTableDto.table,
      createTableDto.options,
    );
  }

  @Post()
  create(@Body() createNodeDto: CreateNodeDto) {
    return this.nodeService.create(createNodeDto);
  }

  @Get()
  findAll(
    @Query('database') database: string,
    @Query('table') table: string,
    @Query('start') start: number,
    @Query('limit') limit: number,
  ) {
    return this.nodeService.findAll(database, table, { start, limit });
  }

  @Get(':id')
  findOne(
    @Query('database') database: string,
    @Query('table') table: string,
    @Param('id') id: string,
  ) {
    return this.nodeService.findOne(database, table, id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNodeDto: UpdateNodeDto) {
    return this.nodeService.update(id, updateNodeDto);
  }

  @Delete(':id')
  remove(
    @Query('database') database: string,
    @Query('table') table: string,
    @Param('id') id: string,
  ) {
    return this.nodeService.remove(database, table, id);
  }
}
