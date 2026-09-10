#!/usr/bin/env python3
"""
Canonical CLI entrypoint for HSL LangGraph pipeline.
Delegates directly to hsl_langgraph_cli.main().
"""
import sys
import os

# Ensure hsl-video-studio directory is in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from hsl_langgraph_cli import main

if __name__ == "__main__":
    main()
