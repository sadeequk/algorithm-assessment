import { sequelize } from "@/lib/db";
import { initCustomer, Customer } from "./customer.model";
import { initOrder, Order } from "./order.model";
import { initRefund, Refund } from "./refund.model";
import { initSupportRequest, SupportRequest } from "./support-request.model";
import { initAgentRun, AgentRun } from "./agent-run.model";
import { initToolCall, ToolCall } from "./tool-call.model";
import { initEscalation, Escalation } from "./escalation.model";

initCustomer(sequelize);
initOrder(sequelize);
initRefund(sequelize);
initSupportRequest(sequelize);
initAgentRun(sequelize);
initToolCall(sequelize);
initEscalation(sequelize);

Customer.hasMany(Order, { foreignKey: "customer_id", as: "orders" });
Order.belongsTo(Customer, { foreignKey: "customer_id", as: "customer" });

Order.hasMany(Refund, { foreignKey: "order_id", as: "refunds" });
Refund.belongsTo(Order, { foreignKey: "order_id", as: "order" });

Customer.hasMany(SupportRequest, { foreignKey: "customer_id", as: "requests" });
SupportRequest.belongsTo(Customer, { foreignKey: "customer_id", as: "customer" });

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
