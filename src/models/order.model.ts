import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import type { OrderStatus } from "./types";

export type OrderAttrs = {
  id: number;
  customer_id: string;
  status: OrderStatus;
  total_cents: number;
  currency: string;
  items_json: unknown;
  shipped_at: Date | null;
  created_at?: Date;
  updated_at?: Date;
};

type OrderCreate = Optional<
  OrderAttrs,
  "currency" | "shipped_at" | "created_at" | "updated_at"
>;

export class Order extends Model<OrderAttrs, OrderCreate> implements OrderAttrs {
  declare id: number;
  declare customer_id: string;
  declare status: OrderStatus;
  declare total_cents: number;
  declare currency: string;
  declare items_json: unknown;
  declare shipped_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date;
}

export function initOrder(sequelize: Sequelize) {
  Order.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true },
      customer_id: { type: DataTypes.UUID, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false },
      total_cents: { type: DataTypes.INTEGER, allowNull: false },
      currency: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "USD",
      },
      items_json: { type: DataTypes.JSONB, allowNull: false },
      shipped_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      tableName: "orders",
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );
  return Order;
}
