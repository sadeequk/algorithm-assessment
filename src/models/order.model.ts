import { DataTypes, Sequelize } from "sequelize";

export default (sequelize: Sequelize) =>
  sequelize.define(
    "Order",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      customer_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      total_cents: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "USD",
      },
      items_json: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      shipped_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "orders",
      timestamps: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );
