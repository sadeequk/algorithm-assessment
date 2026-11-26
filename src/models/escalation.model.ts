import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import type { EscalationStatus, ProposedActionType } from "./types";

export type EscalationAttrs = {
  id: string;
  support_request_id: string;
  proposed_action: ProposedActionType;
  proposed_payload: {
    orderId: number;
    amountCents?: number;
    reason?: string;
  };
  agent_reasoning: string;
  escalation_reason: string;
  status: EscalationStatus;
  resolved_by: string | null;
  resolved_at: Date | null;
  version: number;
  created_at?: Date;
  updated_at?: Date;
};

type EscalationCreate = Optional<
  EscalationAttrs,
  | "id"
  | "status"
  | "resolved_by"
  | "resolved_at"
  | "version"
  | "created_at"
  | "updated_at"
>;

export class Escalation
  extends Model<EscalationAttrs, EscalationCreate>
  implements EscalationAttrs
{
  declare id: string;
  declare support_request_id: string;
  declare proposed_action: ProposedActionType;
  declare proposed_payload: EscalationAttrs["proposed_payload"];
  declare agent_reasoning: string;
  declare escalation_reason: string;
  declare status: EscalationStatus;
  declare resolved_by: string | null;
  declare resolved_at: Date | null;
  declare version: number;
  declare created_at: Date;
  declare updated_at: Date;
}

export function initEscalation(sequelize: Sequelize) {
  Escalation.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      support_request_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },
      proposed_action: { type: DataTypes.STRING, allowNull: false },
      proposed_payload: { type: DataTypes.JSONB, allowNull: false },
      agent_reasoning: { type: DataTypes.TEXT, allowNull: false },
      escalation_reason: { type: DataTypes.TEXT, allowNull: false },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "PENDING",
      },
      resolved_by: { type: DataTypes.STRING, allowNull: true },
      resolved_at: { type: DataTypes.DATE, allowNull: true },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      tableName: "escalations",
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );
  return Escalation;
}
