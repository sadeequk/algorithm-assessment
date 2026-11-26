import { DataTypes, Sequelize } from "sequelize";

export default (sequelize: Sequelize) =>
  sequelize.define(
    "ToolCall",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      agent_run_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      sequence: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      tool_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tool_arguments: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      result: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
    },
    {
      tableName: "tool_calls",
      timestamps: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );
