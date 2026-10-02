import { supabaseAdmin } from "./supabaseAdmin.js";
import { getActiveEmployees, getActiveServices, getClients, getClientVehicles } from "./business.js";
import { findBestMatch, resolveDate } from "./text.js";
import type {
  MoneyCommand,
  RegisterClientCommand,
  RegisterServiceCommand,
  ScheduleCommand,
} from "./commands.js";
import { isValidBrazilianPhone, toLocalPhone } from "./phone.js";

export async function handleRegisterClient(userId: string, cmd: RegisterClientCommand): Promise<string> {
  const phone = toLocalPhone(cmd.phone);
  if (!isValidBrazilianPhone(phone)) {
    return `O telefone "${cmd.phone}" não parece válido. Manda com DDD, só números (ex: 11999998888).`;
  }

  const { error } = await supabaseAdmin.from("clients").insert({
    user_id: userId,
    name: cmd.name,
    phone,
    notes: cmd.car ? `Carro (cadastro via WhatsApp): ${cmd.car}` : null,
  });

  if (error) return "Deu erro ao cadastrar o cliente. Tenta de novo em instantes.";

  return cmd.car
    ? `✅ Cliente cadastrado!\n👤 ${cmd.name}\n📞 ${phone}\n🚗 ${cmd.car}`
    : `✅ Cliente cadastrado!\n👤 ${cmd.name}\n📞 ${phone}`;
}

export async function handleRegisterService(userId: string, cmd: RegisterServiceCommand): Promise<string> {
  const { error } = await supabaseAdmin.from("services").insert({
    user_id: userId,
    name: cmd.name,
    price: cmd.price,
    duration_minutes: cmd.durationMinutes,
  });

  if (error) return "Deu erro ao cadastrar o serviço. Tenta de novo em instantes.";

  return `✅ Serviço cadastrado!\n🔧 ${cmd.name}\n💰 R$ ${cmd.price.toFixed(2)}\n⏱️ ${cmd.durationMinutes} min`;
}

export async function handleSchedule(userId: string, timezone: string | null, cmd: ScheduleCommand): Promise<string> {
  const clients = await getClients(userId);
  const client = findBestMatch(cmd.clientText, clients, (c) => c.name);
  if (!client) {
    return `Não encontrei o cliente "${cmd.clientText}". Cadastra primeiro:\ncadastrar cliente ${cmd.clientText}, telefone, carro (opcional)`;
  }

  const services = await getActiveServices(userId);
  if (!services.length) {
    return "Você ainda não tem nenhum serviço cadastrado. Manda:\ncadastrar serviço Nome, Preço, Duração (opcional)";
  }

  const service = cmd.serviceText ? findBestMatch(cmd.serviceText, services, (s) => s.name) : null;
  if (!service) {
    const names = services.map((s) => `• ${s.name}`).join("\n");
    return `Não identifiquei o serviço${cmd.serviceText ? ` "${cmd.serviceText}"` : ""}. Serviços cadastrados:\n${names}`;
  }

  if (!cmd.time) {
    return "Não identifiquei o horário. Manda incluindo, por exemplo, \"às 14:30\".";
  }

  let vehicleId: string | null = null;
  let vehicleNote: string | null = null;
  if (cmd.vehicleText) {
    const vehicles = await getClientVehicles(userId, client.id);
    const vehicle = findBestMatch(cmd.vehicleText, vehicles, (v) => `${v.brand} ${v.model} ${v.plate}`);
    if (vehicle) {
      vehicleId = vehicle.id;
    } else {
      vehicleNote = `Carro informado: ${cmd.vehicleText}`;
    }
  }

  const price = cmd.value ?? Number(service.price);
  const scheduledDate = resolveDate(cmd.rawText, timezone || "America/Sao_Paulo");

  const { error } = await supabaseAdmin.from("appointments").insert({
    user_id: userId,
    client_id: client.id,
    vehicle_id: vehicleId,
    service_id: service.id,
    scheduled_date: scheduledDate,
    scheduled_time: `${cmd.time}:00`,
    price,
    notes: vehicleNote,
  });

  if (error) return "Deu erro ao criar o agendamento. Tenta de novo em instantes.";

  return (
    `✅ Agendamento criado!\n` +
    `👤 ${client.name}\n` +
    `🔧 ${service.name}\n` +
    (vehicleId ? "" : cmd.vehicleText ? `🚗 ${cmd.vehicleText} (anotado nas observações)\n` : "") +
    `📅 ${scheduledDate.split("-").reverse().join("/")} às ${cmd.time}\n` +
    `💰 R$ ${price.toFixed(2)}`
  );
}

async function resolveEmployee(userId: string, employeeText: string) {
  const employees = await getActiveEmployees(userId);
  if (!employees.length) return { employee: null, listMessage: "Você ainda não tem funcionários cadastrados no sistema." };

  const employee = findBestMatch(employeeText, employees, (e) => e.name);
  if (!employee) {
    const names = employees.map((e) => `• ${e.name}`).join("\n");
    return { employee: null, listMessage: `Não encontrei o funcionário "${employeeText}". Funcionários cadastrados:\n${names}` };
  }
  return { employee, listMessage: null };
}

export async function handleAdvance(userId: string, timezone: string | null, cmd: MoneyCommand): Promise<string> {
  const { employee, listMessage } = await resolveEmployee(userId, cmd.employeeText);
  if (!employee) return listMessage!;

  const date = resolveDate("", timezone || "America/Sao_Paulo");

  const { error: advanceError } = await supabaseAdmin.from("employee_advances").insert({
    user_id: userId,
    employee_id: employee.id,
    amount: cmd.value,
    advance_date: date,
  });
  if (advanceError) return "Deu erro ao registrar o vale. Tenta de novo em instantes.";

  await supabaseAdmin.from("transactions").insert({
    user_id: userId,
    type: "expense",
    amount: cmd.value,
    description: `Adiantamento - ${employee.name}`,
    category: "Adiantamento funcionário",
    payment_method: "cash",
    transaction_date: date,
    employee_id: employee.id,
  });

  return `✅ Vale registrado!\n👤 ${employee.name}\n💰 R$ ${cmd.value.toFixed(2)}`;
}

export async function handlePayment(userId: string, timezone: string | null, cmd: MoneyCommand): Promise<string> {
  const { employee, listMessage } = await resolveEmployee(userId, cmd.employeeText);
  if (!employee) return listMessage!;

  const date = resolveDate("", timezone || "America/Sao_Paulo");

  const { error: paymentError } = await supabaseAdmin.from("employee_payments").insert({
    user_id: userId,
    employee_id: employee.id,
    amount: cmd.value,
    payment_method: "cash",
    payment_date: date,
  });
  if (paymentError) return "Deu erro ao registrar o pagamento. Tenta de novo em instantes.";

  await supabaseAdmin.from("transactions").insert({
    user_id: userId,
    type: "expense",
    amount: cmd.value,
    description: `Pagamento de salário/acumulado - ${employee.name}`,
    category: "Pagamento funcionário",
    payment_method: "cash",
    transaction_date: date,
    employee_id: employee.id,
  });

  await supabaseAdmin
    .from("employee_earnings")
    .update({ status: "paid" })
    .eq("employee_id", employee.id)
    .eq("user_id", userId)
    .eq("status", "pending");

  return `✅ Pagamento registrado!\n👤 ${employee.name}\n💰 R$ ${cmd.value.toFixed(2)}`;
}
