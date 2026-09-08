#!/usr/bin/env python3
"""
================================================================================
🚀 HSL LANGGRAPH CLI // AUTONOMOUS MULTI-AGENT PIPELINE
Hidden Systems Lab (HSL) - Production Control Plane
================================================================================
"""

import argparse
import io
import json
import os
import sys
import time
from typing import Optional, Dict, Any

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich.tree import Tree
from rich import box

console = Console(highlight=False)

from hsl_langgraph.presets import HSL_PRESETS, get_preset
from hsl_langgraph.graph import compile_hsl_graph, create_hsl_graph
from hsl_langgraph.state import HslPipelineState
from hsl_langgraph.bridge import invoke_typescript_stage, get_project_root

console = Console()

def print_banner():
    banner = """
 ██╗  ██╗███████╗██╗         ██╗      █████╗ ███╗   ██╗ ██████╗  ██████╗ ██████╗  █████╗ ██████╗ ██╗  ██╗
 ██║  ██║██╔════╝██║         ██║     ██╔══██╗████╗  ██║██╔════╝ ██╔════╝ ██╔══██╗██╔══██╗██╔══██╗██║  ██║
 ███████║███████╗██║         ██║     ███████║██╔██╗ ██║██║  ███╗██║  ███╗██████╔╝███████║██████╔╝███████║
 ██╔══██║╚════██║██║         ██║     ██╔══██║██║╚██╗██║██║   ██║██║   ██║██╔══██╗██╔══██║██╔═══╝ ██╔══██║
 ██║  ██║███████║███████╗    ███████╗██║  ██║██║ ╚████║╚██████╔╝╚██████╔╝██║  ██║██║  ██║██║     ██║  ██║
 ╚═╝  ╚═╝╚══════╝╚══════╝    ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝
                    HIDDEN SYSTEMS LAB // AUTONOMOUS STATE MACHINE CLI
    """
    console.print(Panel(Text(banner, style="bold cyan"), border_style="bright_blue", box=box.ROUNDED))

def cmd_presets():
    print_banner()
    table = Table(title="🎬 HSL CANONICAL DOCUMENTARY PRESETS", box=box.ROUNDED, header_style="bold magenta")
    table.add_column("Key", style="bold cyan", width=12)
    table.add_column("Episode ID", style="bright_yellow", width=16)
    table.add_column("Topic", style="white", width=34)
    table.add_column("Entity & Mechanism", style="green", width=40)

    for key, data in HSL_PRESETS.items():
        table.add_row(
            key,
            data["id"],
            data["topic"],
            f"[bold]{data['entity']}[/bold]\n↳ {data['mechanism'][:55]}..."
        )

    console.print(table)
    console.print("\n[dim]Para executar um preset:[/dim] [bold cyan]python hsl_langgraph_cli.py run --preset <key>[/bold cyan]\n")

def cmd_graph():
    print_banner()
    console.print("[bold yellow]📊 LANGGRAPH STATE GRAPH TOPOLOGY[/bold yellow]\n")

    tree = Tree("[bold cyan]START[/bold cyan]")
    s1 = tree.add("[bold white]STAGE_01: Scene Director[/bold white] (8 Acts / 96 Beats)")
    s2 = s1.add("[bold white]STAGE_02: Image Engine[/bold white] (35mm Photoreal Frames)")
    s3 = s2.add("[bold white]STAGE_03: Firefly Engine[/bold white] (Video Movement Takes)")
    s4 = s3.add("[bold white]STAGE_04: Narration Engine[/bold white] (ElevenLabs Chris Voice)")
    s5 = s4.add("[bold white]STAGE_05: Sound Design[/bold white] (Multi-Layer Foley & Ambience)")
    s6 = s5.add("[bold yellow]STAGE_06: Pre-Render Gatekeeper[/bold yellow] (Physical Disk Verification)")

    # Conditional Branch
    heal_branch = s6.add("[bold magenta]CONDITIONAL: [Passed?][/bold magenta]")
    heal = heal_branch.add("[bold red]NO -> Auto-Heal Loop[/bold red] (Regenerates missing assets up to 2x)")
    heal.add("↳ Loops back to [bold yellow]STAGE_06[/bold yellow]")

    s7 = heal_branch.add("[bold green]YES -> STAGE_07: Remotion Render[/bold green] (1080p Chunked Render)")
    s8 = s7.add("[bold white]STAGE_08: Pre-Mux Gate[/bold white] (Dynamic Audio-Video Sync)")
    s9 = s8.add("[bold white]STAGE_09: FFmpeg Muxer[/bold white] (Master Video + Voice + Tension)")
    s10 = s9.add("[bold white]STAGE_10: Packaging[/bold white] (3x 4K Thumbs + Strategic SEO)")
    s11 = s10.add("[bold yellow]STAGE_11: PRD Compliance[/bold yellow] (100% Conformance Audit)")

    comp_branch = s11.add("[bold magenta]CONDITIONAL: [100% Rules?][/bold magenta]")
    comp_branch.add("[bold red]NO -> Error Handler / Alert[/bold red]")
    s12 = comp_branch.add("[bold green]YES -> STAGE_12: Cloud Archive[/bold green] (Google Drive & Cleanup)")
    s12.add("[bold cyan]END[/bold cyan]")

    console.print(tree)

    console.print("\n[bold yellow]📜 MERMAID DEFINITION:[/bold yellow]")
    mermaid_code = """```mermaid
flowchart TD
    START([START]) --> S1[STAGE_01: Scene Director]
    S1 --> S2[STAGE_02: Image Engine]
    S2 --> S3[STAGE_03: Firefly Engine]
    S3 --> S4[STAGE_04: Narration Engine]
    S4 --> S5[STAGE_05: Sound Design]
    S5 --> S6[STAGE_06: Pre-Render Gatekeeper]

    S6 --> C1{Gatekeeper Passed?}
    C1 -- Não --> HEAL[Auto-Heal Regeneration]
    HEAL --> S6
    C1 -- Sim --> S7[STAGE_07: Remotion Render]

    S7 --> S8[STAGE_08: Pre-Mux Gate]
    S8 --> S9[STAGE_09: FFmpeg Muxer]
    S9 --> S10[STAGE_10: Packaging]
    S10 --> S11[STAGE_11: PRD Compliance]

    S11 --> C2{Compliance 100%?}
    C2 -- Não --> ERR[Error Handler]
    C2 -- Sim --> S12[STAGE_12: Cloud Archive]
    S12 --> END_NODE([END])
    ERR --> END_NODE
```"""
    console.print(Panel(mermaid_code, border_style="dim", box=box.ROUNDED))

def cmd_step(stage: str, episode_id: str, dry_run: bool):
    print_banner()
    console.print(f"[bold cyan]⚡ EXECUTANDO ESTÁGIO ISOLADO:[/bold cyan] [bold yellow]{stage}[/bold yellow] para [bold green]{episode_id}[/bold green]\n")
    state: HslPipelineState = {
        "episode_id": episode_id,
        "dry_run": dry_run
    }
    t0 = time.time()
    result = invoke_typescript_stage(stage, state, dry_run=dry_run)
    elapsed = time.time() - t0

    console.print("\n[bold green]RESULTADO DO ESTÁGIO:[/bold green]")
    console.print(Panel(json.dumps(result, indent=2), title=f"{stage} ({elapsed:.2f}s)", border_style="cyan"))

def cmd_inspect(episode_id: str):
    print_banner()
    root = get_project_root()
    episode_dir = os.path.join(root, "runs", episode_id)
    manifest_path = os.path.join(root, "runs", episode_id, "run-manifest.json")

    console.print(f"[bold cyan]🔍 INSPECIONANDO EPISÓDIO:[/bold cyan] [bold yellow]{episode_id}[/bold yellow]\n")

    if not os.path.exists(episode_dir):
        console.print(f"[bold red]❌ Diretório de episódio não encontrado em: {episode_dir}[/bold red]")
        return

    table = Table(title=f"Artefatos Físicos em runs/{episode_id}", box=box.ROUNDED)
    table.add_column("Artefato", style="cyan")
    table.add_column("Status / Caminho", style="white")

    scene_plan = os.path.join(episode_dir, "scene-plan.json")
    table.add_row("Scene Plan (8 Atos)", "[green]OK[/green] " + scene_plan if os.path.exists(scene_plan) else "[red]Ausente[/red]")

    frames_dir = os.path.join(root, "public", "runs", episode_id, "frames")
    frames_count = len([f for f in os.listdir(frames_dir) if f.endswith(".png")]) if os.path.exists(frames_dir) else 0
    table.add_row("Frames 35mm", f"[green]{frames_count} frames[/green] em {frames_dir}" if frames_count > 0 else "[red]0 frames[/red]")

    videos_dir = os.path.join(root, "public", "runs", episode_id, "videos")
    videos_count = len([f for f in os.listdir(videos_dir) if f.endswith(".mp4")]) if os.path.exists(videos_dir) else 0
    table.add_row("Takes de Vídeo", f"[green]{videos_count} vídeos[/green] em {videos_dir}" if videos_count > 0 else "[red]0 vídeos[/red]")

    narration_path = os.path.join(episode_dir, "audio", "narration.mp3")
    table.add_row("Áudio Narração", "[green]OK[/green] " + narration_path if os.path.exists(narration_path) else "[red]Ausente[/red]")

    audio_plan = os.path.join(episode_dir, "audio-plan.json")
    table.add_row("Plano de Sound Design", "[green]OK[/green] " + audio_plan if os.path.exists(audio_plan) else "[red]Ausente[/red]")

    final_video = os.path.join(root, "deliveries", episode_id, "video", f"{episode_id.lower()}.mp4")
    table.add_row("Vídeo Master Final", "[bold green]1080p PRONTO[/bold green] " + final_video if os.path.exists(final_video) else "[yellow]Ainda não renderizado[/yellow]")

    console.print(table)

    if os.path.exists(manifest_path):
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest_data = json.load(f)
        console.print(f"\n[bold green]Status Geral do Manifest:[/bold green] [bold yellow]{manifest_data.get('overallStatus')}[/bold yellow]")

def cmd_run(args):
    print_banner()

    # Determine Episode Parameters
    preset_data = get_preset(args.preset) if args.preset else None

    ep_id = args.episode_id or (preset_data["id"] if preset_data else "HSL_EPISODE_001")
    topic = args.topic or (preset_data["topic"] if preset_data else "THE HIDDEN SYSTEM THAT KEEPS PLANES FLYING")
    target_minutes = args.target_minutes or (preset_data["target_minutes"] if preset_data else 10)
    entity = args.entity or (preset_data["entity"] if preset_data else "Airport Jet Fuel Logistics")
    mechanism = args.mechanism or (preset_data["mechanism"] if preset_data else "Pipeline to Hydrant Manifold High-Pressure Injection")
    constraint = args.constraint or (preset_data["constraint"] if preset_data else "Hydrant Pressure Collapse at Node D (72 Units/min)")
    consequence = args.consequence or (preset_data["consequence"] if preset_data else "56 Delayed Flights and $2.7M Cascading Economic Loss")
    thesis = args.thesis or (preset_data["thesis"] if preset_data else "The visible product is a flight; the hidden product is synchronized fuel logistics.")

    initial_state: HslPipelineState = {
        "episode_id": ep_id,
        "topic": topic,
        "target_minutes": target_minutes,
        "entity": entity,
        "mechanism": mechanism,
        "constraint": constraint,
        "consequence": consequence,
        "thesis": thesis,
        "status": "RUNNING",
        "current_stage": "START",
        "completed_stages": [],
        "dry_run": args.dry_run,
        "interactive": args.interactive,
        "recovery_attempts": 0,
        "gatekeeper_passed": False,
        "auto_recovered": False,
        "compliance_passed": False,
        "artifacts": {},
        "logs": [],
        "errors": []
    }

    info_panel = f"""[bold cyan]Episódio:[/bold cyan] [bold yellow]{ep_id}[/bold yellow]
[bold cyan]Tema:[/bold cyan] [white]{topic}[/white]
[bold cyan]Duração Alvo:[/bold cyan] {target_minutes} minutos (18.000 frames @ 30fps)
[bold cyan]Entidade:[/bold cyan] {entity}
[bold cyan]Mecanismo:[/bold cyan] {mechanism}
[bold cyan]Modo:[/bold cyan] {'[bold yellow]DRY-RUN (Simulação & Validação Rápida)[/bold yellow]' if args.dry_run else '[bold green]PRODUÇÃO COMPLETA[/bold green]'}"""

    console.print(Panel(info_panel, title="🎬 CONFIGURAÇÃO DA EXECUÇÃO // LANGGRAPH", border_style="bright_blue", box=box.ROUNDED))

    if args.interactive:
        answer = console.input("\n[bold yellow]Deseja iniciar a orquestração via LangGraph agora? (s/n): [/bold yellow]")
        if answer.lower() not in ["s", "sim", "y", "yes"]:
            console.print("[red]Execução cancelada pelo usuário.[/red]")
            return

    console.log("\n[bold green]🚀 Compilando StateGraph e iniciando fluxo autônomo...[/bold green]\n")

    app = compile_hsl_graph()
    config = {"configurable": {"thread_id": f"hsl_{ep_id.lower()}_{int(time.time())}"}}

    start_time = time.time()
    final_state = initial_state

    # Stream graph execution node by node
    for event in app.stream(initial_state, config):
        for node_name, node_output in event.items():
            final_state.update(node_output)
            console.print(f"[dim]➔ Nó Concluído:[/dim] [bold green]{node_name}[/bold green] | [cyan]Status:[/cyan] {final_state.get('status', 'RUNNING')}")

    total_time = time.time() - start_time

    # Summary Display
    console.print("\n" + "=" * 70)
    if final_state.get("status") == "COMPLETED":
        console.print(f"🎉 [bold green]PIPELINE LANGGRAPH CONCLUÍDO COM SUCESSO EM {total_time:.1f}s![/bold green]")
    elif final_state.get("status") == "BLOCKED":
        console.print(f"🛑 [bold red]PIPELINE LANGGRAPH INTERROMPIDO POR GATE: {final_state.get('errors')}[/bold red]")
    console.print("=" * 70 + "\n")

    summary_table = Table(title="📋 SUMÁRIO DA EXECUÇÃO DO GRAFO", box=box.ROUNDED)
    summary_table.add_column("Métrica / Entregável", style="cyan")
    summary_table.add_column("Valor Registrado", style="white")

    summary_table.add_row("Estágios Concluídos", f"{len(final_state.get('completed_stages', []))} estágios")
    summary_table.add_row("Total de Beats Narrativos", str(final_state.get("total_beats", 96)))
    summary_table.add_row("Gatekeeper Físico", "[green]PASSED[/green]" if final_state.get("gatekeeper_passed") else "[red]BLOCKED[/red]")
    summary_table.add_row("Auto-Cura Acionada", "[yellow]SIM[/yellow]" if final_state.get("auto_recovered") else "[dim]Não necessária[/dim]")
    summary_table.add_row("Conformidade com PRD", "[green]100% APROVADO[/green]" if final_state.get("compliance_passed") else "[red]REPROVADO[/red]")

    titles = final_state.get("titles", [])
    if titles:
        for idx, t in enumerate(titles):
            summary_table.add_row(f"Título Variante {chr(65 + idx)}", f"[bold yellow]{t.get('title')}[/bold yellow] ({t.get('role')})")

    console.print(summary_table)

def main():
    parser = argparse.ArgumentParser(
        description="HSL LangGraph Multi-Agent Documentary CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    subparsers = parser.add_subparsers(dest="command", help="Comandos disponíveis")

    # Command: run
    run_parser = subparsers.add_parser("run", help="Executa o pipeline completo via LangGraph")
    run_parser.add_argument("--preset", "-p", choices=list(HSL_PRESETS.keys()), help="Preset canônico HSL")
    run_parser.add_argument("--episode-id", "-e", help="ID único do episódio (ex: HSL_EPISODE_001)")
    run_parser.add_argument("--topic", "-t", help="Tema personalizado do documentário")
    run_parser.add_argument("--target-minutes", "-m", type=int, default=10, help="Duração alvo em minutos")
    run_parser.add_argument("--entity", help="Entidade central do sistema")
    run_parser.add_argument("--mechanism", help="Mecanismo causal do sistema")
    run_parser.add_argument("--constraint", help="Ponto de gargalo ou colapso")
    run_parser.add_argument("--consequence", help="Impacto econômico ou físico")
    run_parser.add_argument("--thesis", help="Tese documental original")
    run_parser.add_argument("--dry-run", "-d", action="store_true", help="Executa em modo rápido/simulação sem custos")
    run_parser.add_argument("--interactive", "-i", action="store_true", help="Solicita confirmação humana antes de renderizar")

    # Command: presets
    subparsers.add_parser("presets", help="Lista todos os presets de documentários configurados")

    # Command: graph
    subparsers.add_parser("graph", help="Visualiza a topologia do StateGraph (ASCII e Mermaid)")

    # Command: step
    step_parser = subparsers.add_parser("step", help="Executa um estágio individual isolado")
    step_parser.add_argument("--stage", "-s", required=True, help="Nome do estágio (ex: STAGE_01_SCENE_PLAN)")
    step_parser.add_argument("--episode-id", "-e", default="HSL_EPISODE_001", help="ID do episódio")
    step_parser.add_argument("--dry-run", "-d", action="store_true", help="Modo dry-run")

    # Command: inspect
    inspect_parser = subparsers.add_parser("inspect", help="Inspeciona os artefatos de um episódio existente")
    inspect_parser.add_argument("--episode-id", "-e", default="HSL_EPISODE_001", help="ID do episódio")

    args = parser.parse_args()

    if not args.command:
        # Default behavior when run with no arguments: show presets and guide
        print_banner()
        console.print("[bold yellow]Uso rápido:[/bold yellow]")
        console.print("  [cyan]python hsl_langgraph_cli.py run --preset jet_fuel --dry-run[/cyan]   (Execução de teste)")
        console.print("  [cyan]python hsl_langgraph_cli.py run --preset jet_fuel[/cyan]             (Execução de produção)")
        console.print("  [cyan]python hsl_langgraph_cli.py presets[/cyan]                            (Listar episódios)")
        console.print("  [cyan]python hsl_langgraph_cli.py graph[/cyan]                              (Exibir grafo)")
        console.print("  [cyan]python hsl_langgraph_cli.py inspect --episode-id HSL_EPISODE_001[/cyan] (Verificar arquivos)\n")
        return

    if args.command == "presets":
        cmd_presets()
    elif args.command == "graph":
        cmd_graph()
    elif args.command == "step":
        cmd_step(args.stage, args.episode_id, args.dry_run)
    elif args.command == "inspect":
        cmd_inspect(args.episode_id)
    elif args.command == "run":
        cmd_run(args)

if __name__ == "__main__":
    main()
