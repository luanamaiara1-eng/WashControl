

## Problema identificado

O saldo pendente do funcionário está sendo calculado com filtro de período (padrão: 30 dias), mas o saldo é **cumulativo** — precisa considerar TODOS os ganhos, pagamentos e vales desde sempre.

Com filtro de 30 dias, a Jhenifer mostra:
- Ganhos: R$ 1.270 (faltam R$ 210 de ganhos mais antigos)
- Pagamentos: R$ 895
- Vales: R$ 90,08 (faltam R$ 20 de vales mais antigos)
- Saldo: R$ 284,92 ← **errado**

Sem filtro (total real):
- Ganhos: R$ 1.480
- Pagamentos: R$ 895
- Vales: R$ 110,08
- Saldo: R$ 474,92 ← **correto**

## Solução

1. **Separar o cálculo do saldo pendente do filtro de período** — O saldo pendente (cards principais e lista de funcionários) sempre buscará TODOS os dados, sem filtro de data.

2. **Manter o filtro de período apenas para o histórico detalhado** — A tabela de detalhes (ganhos, vales, pagamentos) continua usando o filtro para visualização.

3. **Alterações técnicas**:
   - No hook `useEmployeePaymentSummaries`: criar uma versão que sempre busca sem filtro de datas para calcular o saldo real.
   - Na página `PagamentosFuncionarios.tsx`: usar os summaries sem filtro para os cards e indicadores, e os dados filtrados apenas para as tabelas de histórico.

