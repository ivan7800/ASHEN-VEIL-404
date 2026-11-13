"""Use the configured Chromium binary or Playwright's installed browser."""
from os import environ

def launch(chromium):
    binary=environ.get('ASHEN_CHROMIUM')
    return chromium.launch(executable_path=binary,headless=True)
