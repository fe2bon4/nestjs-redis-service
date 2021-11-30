import { Injectable } from '@nestjs/common';
import { CreateNodeDto } from './dto/create-node.dto';
import { UpdateNodeDto } from './dto/update-node.dto';
import { v4 } from 'uuid';
import { ENodeStatus, Node } from './entities/node.entity';
import RedisStatic, { Redis } from 'ioredis';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const bluebird = require('bluebird');

@Injectable()
export class NodeService {
  private redis: Redis;

  private config = {
    key_databases: 'databases',
    key_databases_options: 'database:dbName:options',
    key_tables: 'database:dbName:tables',
    key_tables_options: 'database:dbName:table:tblName:options',
    key_tables_set: 'database:dbName:table:tblName:items',
    key_record_marker: 'item',
  };

  constructor() {
    this.redis = new RedisStatic({
      host: '127.0.0.1',
      port: 6379,
    });
  }
  private getDatabaseKey = () => this.config.key_tables;
  private getDatabaseOptionsKey = (database: string) =>
    this.config.key_databases_options.replace('dbName', database);
  private getTableSetKey = (database: string) =>
    this.config.key_tables.replace('dbName', database);
  private getTableOptionsKey = (database: string, table: string) =>
    this.config.key_tables_options
      .replace('dbName', database)
      .replace('tblName', table);
  private getTableItemSetKey = (database: string, table: string) =>
    this.config.key_tables_set
      .replace('dbName', database)
      .replace('tblName', table);

  private getItemKey = (database: string, table: string, id: string) =>
    `${database}:${table}:${this.config.key_record_marker}:${id}`;

  private commit = async (key, payload) => {
    await bluebird.map(Object.entries(payload), async ([field, value]) => {
      if (typeof value == 'string' || typeof value == 'number')
        return await this.redis.hset(key, field, value);
      await this.redis.hset(key, field, JSON.stringify(value));
    });
  };
  private async read(key: string) {
    const payload = await this.redis.hgetall(key);
    const reduction = Object.entries(payload).reduce((acc, [field, value]) => {
      const number = parseInt(value);
      if (!isNaN(number)) return { ...acc, [field]: number };
      try {
        const obj = JSON.parse(value);
        return { ...acc, [field]: obj };
      } catch (e) {}
      return { ...acc, [field]: value };
    }, {});

    return reduction;
  }

  async createDatabase(name: string, options?: any) {
    const databases_key = this.getDatabaseKey();
    const database_options_key = this.getDatabaseOptionsKey(name);

    await this.redis.sadd(databases_key, name);
    await this.commit(database_options_key, options);

    return name;
  }

  async createTable(database: string, name: string, options?: any) {
    const tables_key = this.getTableSetKey(database);
    const tables_options_key = this.getTableOptionsKey(database, name);
    await this.redis.sadd(tables_key, name);
    await this.commit(tables_options_key, options);
    return name;
  }

  async listDatabases() {
    const databases_key = this.getDatabaseKey();
    return this.redis.smembers(databases_key);
  }

  async listTables(database: string) {
    const tables_key = this.getTableSetKey(database);
    return this.redis.smembers(tables_key);
  }

  async create({ payload, database, table }: CreateNodeDto) {
    const time = new Date().getTime();

    const node: Node = {
      ...payload,
      id: v4(),
      status: ENodeStatus.DRAFT,
      created_date: time,
      updated_date: time,
    };

    const key = this.getItemKey(database, table, node.id);
    const table_items_key = this.getTableItemSetKey(database, table);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    await this.commit(key, node);
    await this.redis.sadd(table_items_key, key);

    return node.id;
  }

  async findAll(
    database: string,
    table: string,
    options = {
      start: 0,
      limit: 0,
    },
  ) {
    const table_items_key = this.getTableItemSetKey(database, table);
    const keys = await this.redis
      .smembers(table_items_key)
      .then((keys) => keys.slice(options.start, options.limit));

    const items = await bluebird.map(keys, async (key) => await this.read(key));

    return items;
  }

  async findOne(database: string, table: string, id: string) {
    const key = this.getItemKey(database, table, id);
    return this.read(key);
  }

  async update(id: string, { database, table, payload }: UpdateNodeDto) {
    const time = new Date().getTime();

    const key = this.getItemKey(database, table, id);

    const prev_node = await this.redis.hgetall(key);

    const node: Node = {
      ...prev_node,
      ...(payload as Node),
      id,
      updated_date: time,
    };

    await this.commit(key, node);

    return node.id;
  }

  async remove(database: string, table: string, id: string) {
    return this.update(id, {
      database,
      table,
      payload: {
        status: ENodeStatus.ARCHIVED,
      },
    });
  }
}
