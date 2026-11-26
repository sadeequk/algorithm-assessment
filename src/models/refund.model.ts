import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import type { RefundStatus } from "./types";

export type RefundAttrs = {
  id: string;
  order_id: number;
  amount_cents: number;
  status: RefundStatus;
  reason: string | null;
  request_id: string | null;
  created_at?: Date;
  updated_at?: Date;
};

type RefundCreate = Optional<
  RefundAttrs,
  "id" | "status" | "reason" | "request_id" | "created_at" | "updated_at"
>;

export class Refund extends Model<RefundAttrs, RefundCreate> implements RefundAttrs {
  declare id: string;
  declare order_id: number;
  declare amount_cents: number;
  declare status: RefundStatus;
  declare reason: string | null;
  declare request_id: string | null;
  declare created_at: Date;
  declare updated_at: Date;
}

export function initRefund(sequelize: Sequelize) {
  Refund.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      amount_cents: { type: DataTypes.INTEGER, allowNull: false },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "COMPLETED",
      },
      reason: { type: DataTypes.TEXT, allowNull: true },
      request_id: { type: DataTypes.UUID, allowNull: true },
    },
    {
      sequelize,
      tableName: "refunds",
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );
  return Refund;
}
