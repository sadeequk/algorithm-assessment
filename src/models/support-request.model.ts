import { DataTypes, Sequelize } from "sequelize";
import { SupportRequestStatus } from "@/constants";

export default (sequelize: Sequelize) =>
  sequelize.define(
    "SupportRequest",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      customer_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      customer_message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: SupportRequestStatus.RECEIVED,
      },
      outcome_summary: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "support_requests",
      timestamps: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );
