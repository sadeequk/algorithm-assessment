import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export type ToolCallAttrs = {
  id: string;
  agent_run_id: string;
  sequence: number;
  tool_name: string;
  tool_arguments: unknown;
  result: unknown;
  created_at?: Date;
  updated_at?: Date;
};

type ToolCallCreate = Optional<ToolCallAttrs, "id" | "created_at" | "updated_at">;

export class ToolCall
  extends Model<ToolCallAttrs, ToolCallCreate>
  implements ToolCallAttrs
{
  declare id: string;
  declare agent_run_id: string;
  declare sequence: number;
  declare tool_name: string;
  declare tool_arguments: unknown;
  declare result: unknown;
  declare created_at: Date;
  declare updated_at: Date;
}

export function initToolCall(sequelize: Sequelize) {
  ToolCall.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      agent_run_id: { type: DataTypes.UUID, allowNull: false },
      sequence: { type: DataTypes.INTEGER, allowNull: false },
      tool_name: { type: DataTypes.STRING, allowNull: false },
      tool_arguments: { type: DataTypes.JSONB, allowNull: false },
      result: { type: DataTypes.JSONB, allowNull: false },
    },
    {
      sequelize,
      tableName: "tool_calls",
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );
  return ToolCall;
}
