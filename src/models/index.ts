import { sequelize } from "@/lib/db";

import CustomerModel from "./customer.model";
import OrderModel from "./order.model";
import RefundModel from "./refund.model";
import SupportRequestModel from "./support-request.model";
import AgentRunModel from "./agent-run.model";
import ToolCallModel from "./tool-call.model";
import EscalationModel from "./escalation.model";


const Customer: any = CustomerModel(sequelize);
const Order: any = OrderModel(sequelize);
const Refund: any = RefundModel(sequelize);
const SupportRequest: any = SupportRequestModel(sequelize);
const AgentRun: any = AgentRunModel(sequelize);
const ToolCall: any = ToolCallModel(sequelize);
const Escalation: any = EscalationModel(sequelize);

Customer.hasMany(Order, { foreignKey: "customer_id", as: "orders" });
Order.belongsTo(Customer, { foreignKey: "customer_id", as: "customer" });

Order.hasMany(Refund, { foreignKey: "order_id", as: "refunds" });
Refund.belongsTo(Order, { foreignKey: "order_id", as: "order" });

Customer.hasMany(SupportRequest, { foreignKey: "customer_id", as: "requests" });
SupportRequest.belongsTo(Customer, {
  foreignKey: "customer_id",
  as: "customer",
});

SupportRequest.hasMany(AgentRun, {
  foreignKey: "support_request_id",
  as: "agentRuns",
});
AgentRun.belongsTo(SupportRequest, {
  foreignKey: "support_request_id",
  as: "supportRequest",
});

AgentRun.hasMany(ToolCall, { foreignKey: "agent_run_id", as: "toolCalls" });
ToolCall.belongsTo(AgentRun, { foreignKey: "agent_run_id", as: "agentRun" });

SupportRequest.hasOne(Escalation, {
  foreignKey: "support_request_id",
  as: "escalation",
});
Escalation.belongsTo(SupportRequest, {
  foreignKey: "support_request_id",
  as: "supportRequest",
});

export {
  sequelize,
  Customer,
  Order,
  Refund,
  SupportRequest,
  AgentRun,
  ToolCall,
  Escalation,
};

export * from "./types";
