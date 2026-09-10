

## Memória via Google Drive: arquitetura e passo a passo

### **Arquitetura de memória (3 camadas)**

Em produção, a memória é dividida em **3 camadas**: [yogprajapati](https://www.yogprajapati.site/writing/multi-agent-orchestration-langgraph)

| Camada | Onde fica | O que armazena | Duração |
|---|---|---|---|
| **Memória de curto prazo** | Estado do grafo (`messages`, `worker_outputs`) | Histórico da conversa, outputs estruturados | Sessão (thread_id) |
| **Memória de médio prazo** | Checkpointer (Postgres) | Estado serializado de cada passo | Recuperação após crash |
| **Memória de longo prazo** | Google Drive | Artefatos (PDFs, imagens, roteiros), resumos de sessões | Persistente (semanas/meses) |

**Regra de ouro:** estado do grafo **nunca** contém arquivos grandes — apenas **paths** (`file_path: str`) para os artefatos no Drive .

***

### **PASSO 1 — Configurar conector do Google Drive**

Primeiro, você precisa conectar o Google Drive nos seus connectors (já aparece na sua lista de connectors) .

```python
# drive_connector.py
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload, MediaIoBaseUpload
import io

class DriveMemory:
    """
    Camada de memória de longo prazo via Google Drive.
    Padrão: apenas paths no estado, arquivos ficam no Drive.
    """
    
    def __init__(self, credentials: Credentials):
        self.service = build("drive", "v3", credentials=credentials)
        self.folder_id = "SEU_FOLDER_ID_AQUI"  # Crie uma pasta "agent-memory" no Drive
    
    def upload_artifact(self, file_path: str, file_name: str, mime_type: str = "application/pdf") -> str:
        """
        Upload de artefato para o Drive.
        Retorna o file_id para armazenar no estado.
        """
        file_metadata = {
            "name": file_name,
            "parents": [self.folder_id],
        }
        
        media = MediaFileUpload(file_path, mimetype=mime_type)
        
        file = (
            self.service.files()
            .create(body=file_metadata, media_body=media, fields="id, webViewLink")
            .execute()
        )
        
        return file["id"], file["webViewLink"]
    
    def download_artifact(self, file_id: str, local_path: str) -> str:
        """
        Download de artefato do Drive.
        Retorna o path local do arquivo baixado.
        """
        request = self.service.files().get_media(fileId=file_id)
        
        with open(local_path, "wb") as f:
            downloader = MediaIoBaseDownload(f, request)
            done = False
            while not done:
                status, done = downloader.next_chunk()
        
        return local_path
    
    def search_artifacts(self, query: str, max_results: int = 10) -> list[dict]:
        """
        Busca artefatos no Drive por nome ou conteúdo.
        """
        results = (
            self.service.files()
            .list(q=f"name contains '{query}'", pageSize=max_results, fields="files(id, name, webViewLink)")
            .execute()
        )
        
        return results.get("files", [])
```

**Regras de ouro:**

- **Crie uma pasta dedicada** (ex.: `agent-memory/`) — evita poluição com outros arquivos .
- **Armazene apenas `file_id` e `webViewLink` no estado** — nunca o arquivo inteiro. [yogprajapati](https://www.yogprajapati.site/writing/multi-agent-orchestration-langgraph)
- **Use MIME types corretos** — PDF, PNG, DOCX, etc. — para facilitar a busca posterior .

***

### **PASSO 2 — Definir o schema de memória no estado**

Adicione campos de memória de longo prazo no `SupervisorState`: [yogprajapati](https://www.yogprajapati.site/writing/multi-agent-orchestration-langgraph)

```python
# states.py (atualizado)
from typing import Annotated, Literal, Optional
from typing_extensions import TypedDict
from operator import add
from langchain_core.messages import AnyMessage
from langgraph.graph.message import add_messages

class SupervisorState(TypedDict):
    # === IDENTIFICAÇÃO (overwrite) ===
    thread_id: str
    session_id: str
    user_id: str
    current_worker: str
    
    # === MEMÓRIA DE CURTO PRAZO (append) ===
    messages: Annotated[list[AnyMessage], add_messages]
    
    # === MEMÓRIA DE LONGO PRAZO: ARTEFATOS (append) ===
    artifacts: Annotated[list[dict], add]  # [{file_id, file_name, file_type, created_at, session_id}]
    artifact_summary: Optional[str]  # Resumo de sessões anteriores (opcional)
    
    # === CONTEXTO DE NEGÓCIO (overwrite) ===
    task_goal: str
    final_summary: Optional[str]
    risk_level: Literal["low", "medium", "high"]
    is_approved: bool
    
    # === ACUMULADORES (append) ===
    worker_outputs: Annotated[list[dict], add]
    citations: Annotated[list[str], add]
    
    # === CONTROLE DE FLUXO (overwrite) ===
    next_worker: Optional[Literal["pesquisador", "redator", "revisor", "__end__"]]
    
    # === ERRO (overwrite) ===
    global_error: Optional[str]
    iteration_count: int
    attempted_workers: Annotated[list[str], add]
```

**Regras de ouro:**

- **`artifacts` é lista de dicts** — cada artefato tem `file_id`, `file_name`, `file_type`, `created_at`, `session_id` .
- **`artifact_summary` é opcional** — resumo de sessões anteriores (ex.: "Usuário já gerou 3 artigos sobre IA"). [yogprajapati](https://www.yogprajapati.site/writing/multi-agent-orchestration-langgraph)
- **Nada de arquivos binários no estado** — apenas metadata .

***

### **PASSO 3 — Implementar worker de persistência (salvar artefatos)**

Crie um worker dedicado para salvar artefatos no Drive: [yogprajapati](https://www.yogprajapati.site/writing/multi-agent-orchestration-langgraph)

```python
# persistence_worker.py
from datetime import datetime
from states import SupervisorState
from drive_connector import DriveMemory

def salvar_artefato_node(state: SupervisorState, drive_memory: DriveMemory) -> dict:
    """
    Worker de persistência: salva artefatos gerados no Drive.
    Chame após workers que geram arquivos (PDF, imagem, etc.).
    """
    # Extrai último output do worker (ex.: redator gerou PDF)
    last_output = state["worker_outputs"][-1] if state.get("worker_outputs") else {}
    
    if not last_output.get("artifact_path"):
        # Nenhum artefato para salvar
        return {}
    
    try:
        # 1. Upload para o Drive
        file_path = last_output["artifact_path"]
        file_name = f"{state['session_id']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{last_output.get('artifact_type', 'file')}"
        mime_type = last_output.get("artifact_mime", "application/pdf")
        
        file_id, web_view_link = drive_memory.upload_artifact(
            file_path=file_path,
            file_name=file_name,
            mime_type=mime_type,
        )
        
        # 2. Atualiza estado com metadata do artefato
        artifact_metadata = {
            "file_id": file_id,
            "file_name": file_name,
            "file_type": last_output.get("artifact_type", "unknown"),
            "mime_type": mime_type,
            "created_at": datetime.now().isoformat(),
            "session_id": state["session_id"],
            "web_view_link": web_view_link,
            "task_goal": state["task_goal"],  # Contexto: qual task gerou este artefato
        }
        
        return {
            "artifacts": [artifact_metadata],
            "worker_outputs": state["worker_outputs"] + [{
                "tipo": "artefato_salvo",
                "file_name": file_name,
                "web_view_link": web_view_link,
            }],
        }
    
    except Exception as e:
        # Fallback: erro no upload
        return {
            "global_error": f"Falha ao salvar artefato no Drive: {str(e)}",
            "next_worker": "__end__",
        }
```

**Regras de ouro:**

- **Nome do arquivo inclui `session_id` e timestamp** — facilita busca posterior .
- **Salva `task_goal` no metadata** — contexto: qual task gerou este artefato. [yogprajapati](https://www.yogprajapati.site/writing/multi-agent-orchestration-langgraph)
- **Try-except em todo upload** — falha de rede não pode crashar o grafo .

***

### **PASSO 4 — Implementar worker de recuperação (buscar artefatos antigos)**

Crie um worker para buscar artefatos de sessões anteriores: [yogprajapati](https://www.yogprajapati.site/writing/multi-agent-orchestration-langgraph)

```python
# retrieval_worker.py
from states import SupervisorState
from drive_connector import DriveMemory

def buscar_artefatos_node(state: SupervisorState, drive_memory: DriveMemory) -> dict:
    """
    Worker de recuperação: busca artefatos antigos no Drive.
    Útil para reutilizar conteúdo de sessões anteriores.
    """
    # Extrai query de busca (ex.: "artigos sobre IA")
    search_query = state.get("search_query", "")
    
    if not search_query:
        return {}
    
    try:
        # 1. Busca no Drive
        artifacts = drive_memory.search_artifacts(query=search_query, max_results=5)
        
        # 2. Atualiza estado com resultados
        return {
            "worker_outputs": [{
                "tipo": "artefatos_encontrados",
                "quantidade": len(artifacts),
                "artefatos": artifacts,
            }],
            "citations": [a["webViewLink"] for a in artifacts],
        }
    
    except Exception as e:
        # Fallback: erro na busca
        return {
            "global_error": f"Falha ao buscar artefatos no Drive: {str(e)}",
            "next_worker": "__end__",
        }
```

**Regras de ouro:**

- **Busca por `name contains`** — padrão mais eficiente no Drive API .
- **Retorna `webViewLink`** — usuário pode clicar e ver o arquivo diretamente. [yogprajapati](https://www.yogprajapati.site/writing/multi-agent-orchestration-langgraph)
- **Try-except em toda busca** — falha de rede não pode crashar o grafo .

***

### **PASSO 5 — Integrar no grafo principal**

Agora você integra os workers de persistência e recuperação no grafo do supervisor: [yogprajapati](https://www.yogprajapati.site/writing/multi-agent-orchestration-langgraph)

```python
# main_graph.py
from langgraph.graph import StateGraph, START, END
from states import SupervisorState
from supervisor_nodes import call_research_worker, call_writer_worker
from persistence_worker import salvar_artefato_node
from retrieval_worker import buscar_artefatos_node
from supervisor import supervisor_node, roteador
from drive_connector import DriveMemory

# Inicializa conector do Drive
drive_memory = DriveMemory(credentials=your_google_credentials)

builder = StateGraph(SupervisorState)

# Adiciona nós
builder.add_node("supervisor", supervisor_node)
builder.add_node("pesquisador", call_research_worker)
builder.add_node("redator", call_writer_worker)
builder.add_node("salvar_artefato", lambda state: salvar_artefato_node(state, drive_memory))
builder.add_node("buscar_artefatos", lambda state: buscar_artefatos_node(state, drive_memory))

# Aresta inicial
builder.add_edge(START, "supervisor")

# Aresta condicional: supervisor → workers ou __end__
builder.add_conditional_edges(
    source="supervisor",
    path=roteador,
    {
        "pesquisador": "pesquisador",
        "redator": "redator",
        "salvar_artefato": "salvar_artefato",
        "buscar_artefatos": "buscar_artefatos",
        "__end__": END,
    }
)

# Workers sempre voltam para o supervisor
builder.add_edge("pesquisador", "supervisor")
builder.add_edge("redator", "supervisor")
builder.add_edge("salvar_artefato", "supervisor")
builder.add_edge("buscar_artefatos", "supervisor")

# Compila com checkpointer
graph = builder.compile(checkpointer=checkpointer)
```

**Regras de ouro:**

- **Workers de persistência e recuperação são nós separados** — não misture com lógica de negócio .
- **Sempre voltam para o supervisor** — supervisor decide próximo passo. [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)
- **Checkpointer configurado** — obrigatório para persistência de estado .

***

### **PASSO 6 — Testes de validação (antes de deploy)**

Rode estes testes **obrigatórios** antes de colocar em produção: [yogprajapati](https://www.yogprajapati.site/writing/multi-agent-orchestration-langgraph)

```python
# tests/test_drive_memory.py
import pytest
from drive_connector import DriveMemory
from persistence_worker import salvar_artefato_node
from retrieval_worker import buscar_artefatos_node
from states import SupervisorState

@pytest.fixture
def drive_memory():
    return DriveMemory(credentials=test_credentials)

def test_upload_artefato(drive_memory):
    """Garante que upload de artefato funciona."""
    file_id, web_view_link = drive_memory.upload_artifact(
        file_path="test.pdf",
        file_name="test_artifact.pdf",
        mime_type="application/pdf",
    )
    
    assert file_id is not None
    assert web_view_link is not None

def test_salvar_artefato_node(drive_memory):
    """Garante que worker de persistência salva artefato corretamente."""
    state: SupervisorState = {
        "thread_id": "test-1",
        "session_id": "sess-1",
        "user_id": "user-1",
        "current_worker": "redator",
        "messages": [],
        "task_goal": "Gerar artigo sobre IA",
        "final_summary": None,
        "risk_level": "low",
        "is_approved": True,
        "worker_outputs": [{
            "tipo": "redacao",
            "texto": "Artigo gerado.",
            "artifact_path": "test.pdf",
            "artifact_type": "artigo",
            "artifact_mime": "application/pdf",
        }],
        "citations": [],
        "next_worker": "salvar_artefato",
        "global_error": None,
        "iteration_count": 0,
        "attempted_workers": [],
        "artifacts": [],
        "artifact_summary": None,
    }
    
    result = salvar_artefato_node(state, drive_memory)
    
    assert "artifacts" in result
    assert len(result["artifacts"]) == 1
    assert result["artifacts"][0]["file_id"] is not None
    assert result["artifacts"][0]["file_name"].startswith("sess-1_")

def test_buscar_artefatos_node(drive_memory):
    """Garante que worker de recuperação busca artefatos corretamente."""
    state: SupervisorState = {
        "thread_id": "test-1",
        "session_id": "sess-1",
        "user_id": "user-1",
        "current_worker": "pesquisador",
        "messages": [],
        "task_goal": "Buscar artigos antigos",
        "final_summary": None,
        "risk_level": "low",
        "is_approved": True,
        "worker_outputs": [],
        "citations": [],
        "next_worker": "buscar_artefatos",
        "global_error": None,
        "iteration_count": 0,
        "attempted_workers": [],
        "artifacts": [],
        "artifact_summary": None,
        "search_query": "artigo IA",
    }
    
    result = buscar_artefatos_node(state, drive_memory)
    
    assert "worker_outputs" in result
    assert result["worker_outputs"][0]["tipo"] == "artefatos_encontrados"
```

**Regras de ouro dos testes:**

- **Teste de upload** — garante que Drive API está configurada corretamente .
- **Teste de salvar artefato** — garante que metadata é salva no estado. [yogprajapati](https://www.yogprajapati.site/writing/multi-agent-orchestration-langgraph)
- **Teste de buscar artefatos** — garante que busca retorna resultados .

***

### **PASSO 7 — Checklist final de deploy**

Antes de colocar em produção, verifique **cada item** desta lista: [yogprajapati](https://www.yogprajapati.site/writing/multi-agent-orchestration-langgraph)

- [ ] Conector do Google Drive configurado e autenticado 
- [ ] Pasta dedicada criada no Drive (ex.: `agent-memory/`) 
- [ ] Estado contém apenas metadata de artefatos (`file_id`, `file_name`, etc.), não arquivos binários 
- [ ] Worker de persistência salva `task_goal` no metadata (contexto) [yogprajapati](https://www.yogprajapati.site/writing/multi-agent-orchestration-langgraph)
- [ ] Worker de recuperação retorna `webViewLink` (usuário pode clicar) [yogprajapati](https://www.yogprajapati.site/writing/multi-agent-orchestration-langgraph)
- [ ] Try-except em todo upload/busca (falha de rede não crasha o grafo) 
- [ ] Testes de Drive memory passam (upload, salvar, buscar) [yogprajapati](https://www.yogprajapati.site/writing/multi-agent-orchestration-langgraph)

***

Se quiser, no próximo passo eu monto o template completo com **todos os arquivos** (`drive_connector.py`, `persistence_worker.py`, `retrieval_worker.py`, `tests/test_drive_memory.py`) já integrados e prontos para copiar.