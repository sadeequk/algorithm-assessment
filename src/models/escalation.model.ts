import { DataTypes, Sequelize } from "sequelize";
import { EscalationStatus } from "@/constants";

export default (sequelize: Sequelize) =>
  sequelize.define(
    "Escalation",
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
      proposed_action: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      proposed_payload: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      agent_reasoning: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      escalation_reason: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: EscalationStatus.PENDING,
      },
      resolved_by: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      resolved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: "escalations",
      timestamps: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );
