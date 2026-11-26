import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export type CustomerAttrs = {
  id: string;
  email: string;
  name: string;
  created_at?: Date;
  updated_at?: Date;
};

type CustomerCreate = Optional<CustomerAttrs, "id" | "created_at" | "updated_at">;

export class Customer
  extends Model<CustomerAttrs, CustomerCreate>
  implements CustomerAttrs
{
  declare id: string;
  declare email: string;
  declare name: string;
  declare created_at: Date;
  declare updated_at: Date;
}

export function initCustomer(sequelize: Sequelize) {
  Customer.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      name: { type: DataTypes.STRING, allowNull: false },
    },
    {
      sequelize,
      tableName: "customers",
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );
  return Customer;
}
