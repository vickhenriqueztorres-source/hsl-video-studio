import win32gui

def enum_windows():
    def callback(hwnd, extra):
        if win32gui.IsWindowVisible(hwnd):
            title = win32gui.GetWindowText(hwnd)
            if title.strip():
                rect = win32gui.GetWindowRect(hwnd)
                print(f"HWND: {hwnd} | Rect: {rect} | Title: '{title}'")
        return True

    print("=== TODAS AS JANELAS VISÍVEIS ===")
    win32gui.EnumWindows(callback, None)

if __name__ == "__main__":
    enum_windows()
