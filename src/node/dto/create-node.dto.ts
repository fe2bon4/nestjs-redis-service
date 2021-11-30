import { Node } from '../entities/node.entity';

export class CreateNodeDto {
  database: string;
  table: string;
  payload: Omit<Node, 'id' | 'created_date' | 'updated_date'>;
}
