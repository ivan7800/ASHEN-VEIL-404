"""Compare synchronous Canvas draw time in two builds using the same Chromium."""
import argparse
from os import environ
from pathlib import Path
from statistics import median

from playwright.sync_api import sync_playwright


SCENES = [
    ("cripta", 5.4, 19, False),
    ("nave", 27.35, 19.2, False),
    ("vigia-onda", 19.5, 7.55, True),
]
HOOK = """window.qaRender={
  setup(x,y,low,combat){
    Object.assign(player,{x,y});settings.low=low;settings.quiet=false;
    if(combat){
      const boss=enemies.find(enemy=>enemy.type==='boss');
      Object.assign(boss,{phase:2,alert:true,attacksMade:2});
      startEnemyAttack(boss,0,1);
    }
  },
  draw(i){
    tick=i*.043;
    player.ang=-Math.PI/2+Math.sin(i*.13)*.64;
    render();
  }
};
"""
SAMPLE = """([x,y,low,combat])=>{
  const view=window.qaRender;
  view.setup(x,y,low,combat);
  for(let i=0;i<24;i++)view.draw(i);
  const durations=[];
  for(let i=0;i<100;i++){
    const start=performance.now();
    view.draw(i);
    durations.push(performance.now()-start);
  }
  return durations;
}"""


def compare(baseline: Path, candidate: Path) -> None:
    marker = "window.__ashenDiagnostics=()=>({"
    builds = [("base", baseline), ("candidata", candidate)]
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            executable_path=environ.get("ASHEN_CHROMIUM"), headless=True
        )
        print(f"Chromium {browser.version} · mediana y p95 en ms", flush=True)
        for round_number, order in enumerate([builds, builds[::-1]], 1):
            for label, edition in order:
                page = browser.new_page(viewport={"width": 1280, "height": 720})
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                html = (edition / "JUGAR-SIN-INSTALAR.html").read_text(encoding="utf-8")
                if html.count(marker) != 1:
                    raise ValueError(f"No se encontró el punto de diagnóstico en {edition}")
                html = html.replace(marker, HOOK + marker)
                html = html.replace("<head>", "<head><script>window.requestAnimationFrame=()=>0</script>", 1)
                page.set_content(html)
                assert not errors, errors
                for scene, x, y, combat in SCENES:
                    for low in (False, True):
                        values = sorted(page.evaluate(SAMPLE, [x, y, low, combat]))
                        mode = "ligero" if low else "normal"
                        print(f"{round_number} {label} {scene} {mode} {median(values):.2f} {values[94]:.2f}", flush=True)
                assert not errors, errors
                page.context.close()
        browser.close()


if __name__ == "__main__":
    args = argparse.ArgumentParser(description=__doc__)
    args.add_argument("baseline", type=Path, help="checkout de la versión de referencia")
    args.add_argument("--candidate", type=Path, default=Path(__file__).resolve().parent.parent)
    options = args.parse_args()
    compare(options.baseline, options.candidate)
