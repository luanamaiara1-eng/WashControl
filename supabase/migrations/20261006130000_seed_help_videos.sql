-- The user-facing help page (Ajuda.tsx) was showing a hardcoded list instead
-- of the help_videos table Super Admin manages. Seed it with the same
-- starter content so switching Ajuda.tsx over to the real table isn't a
-- regression for anyone who hasn't published tutorials yet.
INSERT INTO public.help_videos (title, description, category, sort_order)
SELECT * FROM (VALUES
  ('Primeiros passos no WashControl', 'Conheça o painel e configure seu negócio.', 'Começando', 1),
  ('Como cadastrar serviços', 'Crie seus serviços, preços e duração.', 'Começando', 2),
  ('Clientes e veículos', 'Cadastre clientes, veículos e mantenha o histórico organizado.', 'Operação', 3),
  ('Como usar os agendamentos', 'Crie, acompanhe e atualize seus atendimentos.', 'Operação', 4),
  ('Funcionários e equipe', 'Organize sua equipe e responsáveis pelos serviços.', 'Operação', 5),
  ('WhatsApp e automações', 'Conecte seu WhatsApp e configure comandos e mensagens.', 'Automação', 6),
  ('Lembretes automáticos', 'Entenda como os lembretes de agendamento funcionam.', 'Automação', 7),
  ('Vitrine e pedidos pelo WhatsApp', 'Publique produtos e serviços e receba pedidos.', 'Vendas', 8),
  ('Financeiro', 'Registre entradas, saídas e acompanhe seu caixa.', 'Gestão', 9),
  ('Relatórios', 'Acompanhe os principais números do negócio.', 'Gestão', 10),
  ('Configurações', 'Ajuste dados do estabelecimento, horários e preferências.', 'Configurações', 11)
) AS seed(title, description, category, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.help_videos);
