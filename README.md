# 🏘️ RepOP — Buscador de Repúblicas em Ouro Preto

## 📖 Descrição do Projeto

O **RepOP** é uma plataforma web (atualmente em desenvolvimento) focada em centralizar e facilitar a busca por moradia estudantil e particular na histórica cidade universitária de Ouro Preto. A aplicação serve como uma ponte direta entre pessoas que precisam de um lugar para morar e as repúblicas que possuem vagas disponíveis.

## ⚠️ O Problema

Encontrar uma república ideal em Ouro Preto costuma ser um processo caótico. Historicamente, as informações se dispersam em grupos de redes sociais, cartazes nas ruas ou pelo boca a boca. Isso gera:

- **Para o buscador:** Estresse, perda de tempo e dificuldade para comparar opções (preços, regras, localização).
- **Para os donos/moradores:** Dificuldade para divulgar sua república e preencher rapidamente os quartos ou vagas disponíveis, o que pode impactar a economia da casa.

## ✨ Fluxo e Principais Funcionalidades

1. **Para os Usuários (Buscadores):**
   - Cadastro e criação de conta na plataforma.
   - Busca e filtragem de repúblicas disponíveis em Ouro Preto.
   - Visualização de informações essenciais (fotos, regras, custos e vagas disponíveis).

2. **Para Donos / Representantes de Repúblicas:**
   - Cadastro como administrador de uma república.
   - Perfil da casa: possibilidade de se apresentar, listar características e ambiente.
   - **Gestão de vagas:** Publicar em tempo real se há quartos ou vagas disponíveis para atrair inquilinos rapidamente.

## 🗂️ Quadro Kanban

O acompanhamento das tarefas e o progresso do projeto são gerenciados no quadro Kanban abaixo:

🔗 **[Acessar o Kanban do RepOP](https://github.com/users/jrcorreaga-cloud/projects/2)**

> _Substitua o link acima pelo endereço real do seu quadro (Trello, Notion, Jira, etc.)._

## 🛠️ Stack Tecnológico (Arquitetura MVC)

- **Backend:** FastAPI (Python)
- **Frontend:** React + Vite (JavaScript)
- **Banco de Dados:** MySQL
- **Contêineres:** Docker e Docker Compose para facilitar deploys e testes.

## 🗄️ Diagrama Entidade-Relacionamento

O diagrama ER do banco de dados do RepOP está disponível abaixo:

![Diagrama ER RepOP](docs/imagenes/diagrama%20ER%20REPOop.png)

---

## 🚀 Guia de Início Rápido (Localhost)

Para rodar o projeto na sua máquina local:

### 1. Subir o Backend (FastAPI)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

_A API estará documentada e rodando em: `http://localhost:8000/docs`_

### 2. Subir o Frontend (React)

Abra outro terminal e execute:

```bash
cd frontend
npm install
npm run dev
```

_A interface estará disponível em: `http://localhost:5173`_

---

## 👥 Integrantes

- César Eduardo Paredes Torres
- Jordan Rivaldo Correa Garcia
- Ryan Alessandro Lázaro Urtecho
- Tommy Rodriguez Zavaleta
