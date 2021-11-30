import { Node } from '../entities/node.entity';

export class UpdateNodeDto {
  database: string;
  table: string;
  payload: Partial<Omit<Node, 'id' | 'updated_date'>>;
}
