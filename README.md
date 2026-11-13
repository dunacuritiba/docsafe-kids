# DocSafe LGPD - Plataforma Segura de Registro de Documentos

Aplicação web moderna, clean e responsiva construída em **React**, **TypeScript**, **Tailwind CSS** e **Web Crypto API**, projetada para cadastro seguro de pessoas e arquivamento de documentos sensíveis com proteção criptográfica ponta a ponta e total conformidade com a **Lei Geral de Proteção de Dados (LGPD - Lei Federal nº 13.709/2018)**.

---

## 🚀 Principais Funcionalidades

### 1. Autenticação e Cadastro
- **Login Seguro**:
  - Acesso com e-mail e senha.
  - Derivação de chave AES-256 no cliente usando PBKDF2 (100.000 iterações com salt seguro).
  - Botão de preenchimento rápido para demonstração.
- **Formulário de Cadastro**:
  - **Nome Completo**
  - **E-mail**
  - **Senha e Confirmação** com visualizador e validações
  - **Telefone Celular** com máscara brasileira adaptativa `(XX) XXXXX-XXXX`
  - **CPF** com máscara `XXX.XXX.XXX-XX` e validação matemática de dígitos verificadores
  - **Rede de Vinculação**: Select customizado com as 12 redes disponíveis:
    - `AMARELA`, `AZUL`, `VERDE`, `VERMELHA`, `BRANCA`, `MARROM`, `ARAUCÁRIA`, `SJP`, `MONTE MOR`, `CAMPINAS`, `ITAPECERICA DA SERRA`, `LONDRINA`.
  - **Foto de Identificação**:
    - Upload de arquivo de imagem do dispositivo.
    - Captura direta via **Webcam/Câmera** com preview ao vivo e alternância de câmera (frontal/traseira).
  - **Termo de Consentimento LGPD**: Checkbox obrigatório e modal explicativo com os direitos do titular.

### 2. Gestão de Documentos (Cofre Criptografado)
- Cadastro de documentos com categorias (RG, CPF, CNH, Certidões, Comprovante de Residência, etc.).
- Armazenamento com **AES-GCM 256 bits** dos números e dos anexos fotográficos/PDFs.
- Captura de fotos de documentos pela Câmera ou upload de arquivos.
- Controle de data de validade com alertas para documentos vencidos ou próximos do vencimento.
- Modo Privacidade ("olho") para ocultar ou revelar números confidenciais na listagem.
- Filtros em tempo real por texto, tipo de documento e status de validade.

### 3. Perfis de Acesso: Usuário vs Diácono
- **Usuário (`USUARIO`)**:
  - Perfil padrão de todo novo membro.
  - Acessa o cofre pessoal para registrar sua Certidão de Antecedentes Criminais, acompanhar seus 90 dias de validade e auditar seus dados.
- **Diácono (`DIACONO`)**:
  - Perfil de supervisão e auditoria institucional.
  - Acessa o **Painel do Diácono** com a **Tabela Geral Consolidada** contendo todas as certidões de todos os usuários.
  - **Filtros Avançados**:
    - **Por Mês**: Filtro por mês de expedição das certidões.
    - **Por Rede**: Filtro entre as 12 redes regionais.
    - **Por Usuário / Titular**: Busca instantânea por nome, e-mail, CPF ou número do documento.
    - **Por Validação**: Aprovadas (100% Match), Divergentes (Nome/Data de Nascimento) ou Com Antecedentes.
    - **Por Prazo de 90 dias**: Válidas, Vencendo em breve (≤ 15 dias) e Expiradas.
  - **Exportação em CSV**: Download com um clique da relação completa de certidões e conformidades para relatórios diaconais.

### 4. Central de Privacidade & LGPD (Art. 18)
- **Base Legal**: Informação clara sobre o tratamento fundamentado no Art. 7º, I da LGPD.
- **Transparência Criptográfica**: Inspetor comparativo entre o dado em memória ativa decifrado e o ciphertext salvo no banco.
- **Portabilidade de Dados (Art. 18, V)**: Exportação integral de todos os dados do titular e seus documentos em formato JSON aberto com um clique.
- **Direito à Eliminação / Esquecimento (Art. 18, VI)**: Opção de excluir permanentemente a conta, chaves e todos os documentos anexados.
- **Trilha de Auditoria LGPD**: Registro automático de eventos de acesso, cadastro, criptografia e exclusão.

---

## ☁️ Integração com Supabase (`usuarios-kids`)

Os dados da aplicação são salvos e sincronizados diretamente com o banco de dados **Supabase** (projeto `duna-kids`):

- **Tabela Principal**: `usuarios-kids`
  - Armazena os usuários cadastrados, com `encrypted_cpf` e `encrypted_telefone` devidamente cifrados via AES-GCM 256 bits, `password_hash` (SHA-256 com salt) e a rede selecionada.
- **Tabela de Documentos**: `documentos-kids`
  - Registra todos os documentos, validades e anexos protegidos.
- **Tabela de Auditoria**: `lgpd-logs-kids`
  - Histórico de compliance da LGPD (cadastros, acessos, exportações e exclusões).

As tabelas contam com políticas de **Row Level Security (RLS)** ativadas para proteção de acesso.

---

## 🛠️ Tecnologias Utilizadas

- **React 19** com Vite
- **TypeScript** para tipagem estática e segurança
- **Tailwind CSS v4** para interface moderna e limpa
- **Lucide React** para iconografia
- **Web Crypto API nativa** (`crypto.subtle` com PBKDF2 e AES-GCM 256 bits)

---

## 💻 Como Rodar o Projeto

```bash
# Entrar no diretório do projeto
cd C:\Users\suportesecid\.gemini\antigravity\scratch\doc-registry-app

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse em seu navegador: **http://127.0.0.1:5173**
