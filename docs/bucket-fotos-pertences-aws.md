# Configuração do bucket S3 das fotos de pertences (AWS)

Este guia mostra como criar e configurar o **bucket S3 dedicado às fotos de
pertences do acolhido** em produção.

## Como o sistema usa os buckets

O binário das fotos de pertences fica no S3; o banco guarda apenas os metadados
e a chave do objeto. O bucket é escolhido pela propriedade
`app.pertences-fotos.bucket` (ver `src/main/resources/application.properties`):

| Ambiente | Bucket usado | Observação |
| --- | --- | --- |
| **Desenvolvimento** (`%dev`) | `anexos-acolhidos-sistemactav-com-br` | O **mesmo** bucket dos anexos e das fotos de perfil. Nada novo a criar. |
| **Testes** (`%test`) | `pertences-teste-local` | Não há acesso real ao S3 nos testes. |
| **Produção** (`%prod`) | `pertences-acolhidos-sistemactav-com-br` | Bucket **novo e separado**, criado pelos passos abaixo. Pode ser sobreposto pela variável de ambiente `PERTENCES_FOTOS_BUCKET`. |

As chaves dos objetos seguem o padrão:

```
acolhidos/{acolhidoId}/pertences/{pertenceId}/{uuid}-{nomeArquivo}
```

A região é `sa-east-1` (São Paulo), igual à do bucket de anexos.

---

## Passo 1 — Criar o bucket

### Opção A: Console da AWS

1. Acesse **S3 → Buckets → Create bucket**.
2. **Bucket name**: `pertences-acolhidos-sistemactav-com-br`
   (use exatamente o mesmo nome configurado em `%prod.app.pertences-fotos.bucket`,
   ou defina outro nome e exponha-o via variável `PERTENCES_FOTOS_BUCKET`).
3. **AWS Region**: `América do Sul (São Paulo) sa-east-1`.
4. **Block Public Access**: mantenha **tudo marcado** (bloqueado). O acesso às
   imagens é feito por **URLs pré-assinadas** temporárias geradas pela API — o
   bucket não precisa (e não deve) ser público.
5. **Bucket Versioning**: opcional (desativado é suficiente).
6. **Default encryption**: mantenha **SSE-S3 (Amazon S3 managed keys)** ligado.
7. Clique em **Create bucket**.

### Opção B: AWS CLI

```bash
aws s3api create-bucket \
  --bucket pertences-acolhidos-sistemactav-com-br \
  --region sa-east-1 \
  --create-bucket-configuration LocationConstraint=sa-east-1

# Garante o bloqueio de acesso público
aws s3api put-public-access-block \
  --bucket pertences-acolhidos-sistemactav-com-br \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# Criptografia padrão
aws s3api put-bucket-encryption \
  --bucket pertences-acolhidos-sistemactav-com-br \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
```

---

## Passo 2 — Dar permissão à aplicação (IAM)

Em produção a API roda na EC2 e usa a **Role da instância** (default credentials
chain). Basta adicionar o novo bucket à política dessa Role.

1. Descubra a Role usada pela EC2: **EC2 → Instâncias → sua instância → aba
   Segurança → IAM Role**.
2. Abra **IAM → Roles → (essa role) → Add permissions → Create inline policy**.
3. Cole a política abaixo (ela concede leitura/escrita/exclusão **apenas** neste
   bucket):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "FotosPertencesObjetos",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::pertences-acolhidos-sistemactav-com-br/*"
    },
    {
      "Sid": "FotosPertencesBucket",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::pertences-acolhidos-sistemactav-com-br"
    }
  ]
}
```

4. Salve a política.

> As URLs pré-assinadas são geradas com as credenciais dessa Role; por isso a
> permissão `s3:GetObject` é suficiente para exibir e baixar as fotos.

---

## Passo 3 — (Opcional) CORS

Exibir a imagem via `<img src="URL pré-assinada">` **não** exige CORS. Configure
o CORS apenas se, no futuro, o frontend passar a buscar as imagens via
`fetch/XHR`. Nesse caso:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET"],
    "AllowedOrigins": [
      "https://www.sistemactav.com.br",
      "http://SEU_IP_PUBLICO_EC2"
    ],
    "ExposeHeaders": []
  }
]
```

Aplique em **S3 → bucket → Permissions → Cross-origin resource sharing (CORS)**.

---

## Passo 4 — Apontar a aplicação para o bucket

O nome já vem configurado em `application.properties`:

```properties
%prod.app.pertences-fotos.bucket=${PERTENCES_FOTOS_BUCKET:pertences-acolhidos-sistemactav-com-br}
```

- Se você usou **exatamente** o nome `pertences-acolhidos-sistemactav-com-br`,
  não precisa fazer nada.
- Se escolheu **outro nome**, defina a variável de ambiente antes de subir o JAR:

```bash
export PERTENCES_FOTOS_BUCKET=nome-do-seu-bucket
```

Reinicie a aplicação após a mudança.

---

## Passo 5 — Verificar

1. Rode o script SQL `sql/add_pertences_postgresql.sql` no banco de produção
   (ou deixe o Hibernate criar as tabelas se `database.generation=update`).
2. Na aplicação, edite um acolhido → aba **Pertences** → adicione um pertence e
   anexe uma foto JPG/PNG.
3. Confirme que a foto aparece (miniatura) e, no bucket, que o objeto foi criado
   em `acolhidos/{id}/pertences/{id}/...`.
4. Exclua a foto pela interface e confirme que o objeto some do bucket.

---

## Resumo rápido

- **Nome do bucket (prod):** `pertences-acolhidos-sistemactav-com-br`
- **Região:** `sa-east-1`
- **Acesso público:** bloqueado (imagens via URL pré-assinada)
- **Permissões da Role EC2:** `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`
  (+ `s3:ListBucket`) apenas neste bucket
- **Dev/local:** reaproveita o bucket de anexos — nada a criar
