import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export type AgentRunAttrs = {
  id: string;
  support_request_id: string;
  status: string;
  final_outcome: string | null;
  reasoning_summary: string | null;
  started_at: Date;
  completed_at: Date | null;
  created_at?: Date;
  updated_at?: Date;
};

type AgentRunCreate = Optional<
  AgentRunAttrs,
  | "id"
  | "final_outcome"
  | "reasoning_summary"
  | "started_at"
  | "completed_at"
  | "created_at"
  | "updated_at"
>;

export class AgentRun
  extends Model<AgentRunAttrs, AgentRunCreate>
  implements AgentRunAttrs
{
  declare id: string;
  declare support_request_id: string;
  declare status: string;
  declare final_outcome: string | null;
  declare reasoning_summary: string | null;
  declare started_at: Date;
  declare completed_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date;
}

export function initAgentRun(sequelize: Sequelize) {
  AgentRun.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      support_request_id: { type: DataTypes.UUID, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false },
      final_outcome: { type: DataTypes.TEXT, allowNull: true },
      reasoning_summary: { type: DataTypes.TEXT, allowNull: true },
      started_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      completed_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      tableName: "agent_runs",
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );
  return AgentRun;
}
