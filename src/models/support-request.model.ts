import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import type { SupportRequestStatus } from "./types";

export type SupportRequestAttrs = {
  id: string;
  customer_id: string | null;
  customer_message: string;
  status: SupportRequestStatus;
  outcome_summary: string | null;
  created_at?: Date;
  updated_at?: Date;
};

type SupportRequestCreate = Optional<
  SupportRequestAttrs,
  | "id"
  | "customer_id"
  | "status"
  | "outcome_summary"
  | "created_at"
  | "updated_at"
>;

export class SupportRequest
  extends Model<SupportRequestAttrs, SupportRequestCreate>
  implements SupportRequestAttrs
{
  declare id: string;
  declare customer_id: string | null;
  declare customer_message: string;
  declare status: SupportRequestStatus;
  declare outcome_summary: string | null;
  declare created_at: Date;
  declare updated_at: Date;
}

export function initSupportRequest(sequelize: Sequelize) {
  SupportRequest.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      customer_id: { type: DataTypes.UUID, allowNull: true },
      customer_message: { type: DataTypes.TEXT, allowNull: false },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "RECEIVED",
      },
      outcome_summary: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      tableName: "support_requests",
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );
  return SupportRequest;
}
