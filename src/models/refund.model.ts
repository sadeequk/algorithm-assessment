import { DataTypes, Sequelize } from "sequelize";
import { RefundStatus } from "@/constants";

export default (sequelize: Sequelize) =>
  sequelize.define(
    "Refund",
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
      amount_cents: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: RefundStatus.COMPLETED,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      request_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: "refunds",
      timestamps: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );
