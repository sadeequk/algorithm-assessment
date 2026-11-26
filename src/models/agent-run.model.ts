import { DataTypes, Sequelize } from "sequelize";

export default (sequelize: Sequelize) =>
  sequelize.define(
    "AgentRun",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      support_request_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      final_outcome: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      reasoning_summary: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      started_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "agent_runs",
      timestamps: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );
