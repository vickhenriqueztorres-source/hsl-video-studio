import uiautomation as auto
import time

def find_buttons():
    print("[UI Automation] Varrendo janelas abertas buscando botões de confirmação...")
    for win in auto.GetRootControl().GetChildren():
        name = win.Name
        if any(w in name.lower() for w in ["antigravity", "gemini", "code", "cursor", "windsurf", "electron", "b2", "hsl"]):
            print(f"-> Janela encontrada: {name} (Class: {win.ClassName})")
            
            # Procurar botões dentro da janela
            buttons = win.GetChildren()
            for btn in win.WalkTree(maxDepth=12):
                if btn.ControlType == auto.ControlType.ButtonControl or btn.ControlType == auto.ControlType.HyperlinkControl:
                    b_name = btn.Name.strip()
                    if b_name:
                        print(f"   [Botão] '{b_name}' | Rect: {btn.BoundingRectangle}")

if __name__ == "__main__":
    find_buttons()
