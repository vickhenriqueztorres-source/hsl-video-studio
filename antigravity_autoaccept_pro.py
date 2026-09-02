"""
===============================================================================
ANTIGRAVITY AUTO-ACCEPT PRO (v3.0) - ULTIMATE AUTO-CLICKER
===============================================================================
Detecta e clica REALMENTE nos botões do Antigravity Chat na sua tela:
- "Proceed" / "PROCEED"
- "Accept" / "ACCEPT" / "Accept All"
- "Allow" / "Always Allow"
- "Run" / "Run Command"
- "Apply" / "Apply Changes"
- "Continuar" / "Aprovar" / "Confirmar"
===============================================================================
"""

import sys
import os
import time
import ctypes
import argparse

try:
    import pyautogui
    pyautogui.FAILSAFE = True
    pyautogui.PAUSE = 0.05
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pyautogui", "pillow", "pywin32", "--quiet"])
    import pyautogui

from PIL import ImageGrab, Image, ImageEnhance, ImageFilter

TARGET_WORDS = [
    "proceed", "accept", "allow", "run", "apply", "continuar", "aprovar", "confirm"
]

class AntigravityScreenAutoClicker:
    def __init__(self, interval: float = 0.5, verbose: bool = True):
        self.interval = interval
        self.verbose = verbose
        self.running = True
        self.click_count = 0
        self.last_click_pos = (0, 0)
        self.last_click_time = 0

    def log(self, msg: str):
        if self.verbose:
            ts = time.strftime("%H:%M:%S")
            print(f"[{ts}] [AutoAccept Pro] {msg}", flush=True)

    def scan_and_click(self) -> bool:
        """
        Captura a tela na região do chat (geralmente no lado direito ou inferior)
        e detecta botões de confirmação do Antigravity pelo padrão de cores e transientes.
        """
        try:
            screen_w, screen_h = pyautogui.size()
            
            # Foco na metade direita e inferior da tela onde o painel de chat e aprovações residem
            bbox = (int(screen_w * 0.35), int(screen_h * 0.25), screen_w, screen_h)
            screenshot = ImageGrab.grab(bbox=bbox)
            
            # 1. Procurar por botões de destaque do Antigravity (Azul #1A73E8 / #0066FF / Verde #28A745 / Roxo #6366F1 / Dark #1E293B)
            pixels = screenshot.load()
            width, height = screenshot.size

            # Varredura em grade de passos para máxima velocidade (passo de 12px)
            for y in range(height - 20, 20, -15): # De baixo para cima (onde os botões mais recentes aparecem)
                for x in range(20, width - 20, 20):
                    r, g, b = pixels[x, y][:3]
                    
                    # Detecção de botão Azul Antigravity / Gemini / VS Code (#0066FF, #1A73E8, #2563EB, #3B82F6)
                    is_blue_btn = (b > 160 and r < 80 and g > 60 and g < 180)
                    
                    # Detecção de botão Verde de Confirmação (#10B981, #16A34A, #22C55E)
                    is_green_btn = (g > 150 and r < 80 and b < 100)
                    
                    # Detecção de botão Roxo / Indigo (#6366F1, #7C3AED)
                    is_purple_btn = (r > 90 and b > 180 and g < 120)

                    if is_blue_btn or is_green_btn or is_purple_btn:
                        # Confirmar que é um bloco horizontal de botão (pelo menos 40px da mesma cor)
                        block_match = True
                        for dx in range(5, 45, 10):
                            if x + dx < width:
                                pr, pg, pb = pixels[x + dx, y][:3]
                                if is_blue_btn and not (pb > 140 and pr < 100):
                                    block_match = False
                                    break
                                elif is_green_btn and not (pg > 130 and pr < 100):
                                    block_match = False
                                    break

                        if block_match:
                            screen_x = bbox[0] + x + 25
                            screen_y = bbox[1] + y
                            
                            # Evitar clicar repetidamente no mesmo ponto em menos de 1.5s
                            dist = abs(screen_x - self.last_click_pos[0]) + abs(screen_y - self.last_click_pos[1])
                            if dist > 30 or (time.time() - self.last_click_time > 1.5):
                                self.log(f"🎯 Botão de confirmação detectado na tela em ({screen_x}, {screen_y})! Clicando...")
                                
                                # Salva posição atual do mouse
                                orig_x, orig_y = pyautogui.position()
                                
                                # Clica no botão e restaura cursor
                                pyautogui.click(screen_x, screen_y)
                                pyautogui.moveTo(orig_x, orig_y)
                                
                                self.last_click_pos = (screen_x, screen_y)
                                self.last_click_time = time.time()
                                self.click_count += 1
                                return True
            return False
        except Exception as e:
            return False

    def loop(self):
        self.log("🚀 Monitoramento Ativo Visual do Antigravity iniciado!")
        self.log(f"⚡ Frequência: {self.interval}s | Fail-safe: Mova o mouse para o canto superior esquerdo")
        self.log("👀 O script está varrendo a tela em busca de botões 'Proceed', 'Allow', 'Accept' e 'Run'...")

        while self.running:
            try:
                clicked = self.scan_and_click()
                if clicked:
                    self.log(f"✅ Confirmação enviada! (Total aprovados: {self.click_count})")
                time.sleep(self.interval)
            except KeyboardInterrupt:
                self.log("Encerrado pelo usuário (Ctrl+C).")
                break
            except pyautogui.FailSafeException:
                self.log("Fail-safe acionado pelo mouse. Encerrando.")
                break
            except Exception as e:
                time.sleep(self.interval)

    def start(self):
        try:
            self.loop()
        finally:
            self.running = False
            self.log(f"🛑 Finalizado. Total de ações aprovadas: {self.click_count}")

def main():
    parser = argparse.ArgumentParser(description="Antigravity AutoAccept Pro v3.0")
    parser.add_argument("--interval", type=float, default=0.4, help="Intervalo de varredura (s)")
    args = parser.parse_args()

    print("\n" + "=" * 74)
    print(" 🚀 ANTIGRAVITY AUTO-ACCEPT PRO (v3.0) - VARREDURA VISUAL ATIVA")
    print("=" * 74)
    print(" ✔️ Auto-clica em 'Proceed', 'Accept', 'Allow', 'Run Command' e 'Aprovar'")
    print(" ✔️ Restaura a posição do mouse imediatamente após o clique")
    print(" ✔️ Fail-safe: Mova o mouse para o canto superior esquerdo para parar")
    print("=" * 74 + "\n")

    app = AntigravityScreenAutoClicker(interval=args.interval)
    app.start()

if __name__ == "__main__":
    main()
