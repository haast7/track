# Índices do Firestore Necessários

Este documento lista todos os índices compostos necessários para o funcionamento correto do sistema.

## Como Criar os Índices

Quando você executar uma query que requer um índice composto, o Firebase mostrará um erro com um link direto para criar o índice. Clique no link e o Firebase criará automaticamente.

Alternativamente, você pode criar manualmente no [Console do Firebase](https://console.firebase.google.com/):

1. Acesse seu projeto no Firebase Console
2. Vá em **Firestore Database** → **Índices**
3. Clique em **Criar Índice**
4. Configure conforme as especificações abaixo

## Índices Necessários

### 1. Coleção: `leads`

**Query usada em:** `src/pages/Leads.tsx`

**Campos:**
- `userId` (Ascendente)
- `enteredAt` (Descendente)

**Tipo:** Composto

**Link de criação automática:**
O erro no console fornecerá um link direto. Geralmente é algo como:
```
https://console.firebase.google.com/v1/r/project/[PROJECT_ID]/firestore/indexes?create_composite=...
```

### 2. Coleção: `postback_logs`

**Query usada em:** `src/pages/Postbacks.tsx`

**Campos:**
- `userId` (Ascendente)
- `createdAt` (Descendente)

**Tipo:** Composto

**Nota:** Este índice também pode ser necessário se você usar a query com `limit(100)`.

## Verificação

Após criar os índices, eles podem levar alguns minutos para serem construídos. Você pode verificar o status no Console do Firebase em **Firestore Database** → **Índices**.

Quando o status mudar de "Criando" para "Habilitado", as queries funcionarão corretamente.

## Troubleshooting

Se você ainda receber erros de índice após criar:

1. Verifique se o índice está com status "Habilitado"
2. Aguarde alguns minutos (índices grandes podem levar tempo)
3. Verifique se os nomes dos campos estão corretos (case-sensitive)
4. Certifique-se de que os tipos de dados estão corretos (Timestamp para datas)


