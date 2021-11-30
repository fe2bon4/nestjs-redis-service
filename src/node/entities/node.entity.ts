export enum ENodeStatus {
  DRAFT = 'Draft',
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  ARCHIVED = 'Archived',
}
export class Node<TAttribute = Record<string, any>> {
  id: string;
  created_date: number;
  updated_date: number;
  status: ENodeStatus;
  attribute: TAttribute;
}
