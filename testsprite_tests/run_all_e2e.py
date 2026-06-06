"""Run all TestSprite E2E tests. Requires: npm run dev:e2e, npm run seed:e2e, playwright install chromium."""
import glob
import os
import subprocess
import sys

BASE_DIR = os.path.dirname(__file__)


def warmup():
    import urllib.request

    base = os.environ.get("TRSTIT_BASE_URL", "http://localhost:3000")
    for path in ("/", "/dashboard", "/profile", "/landlord", "/verify/demo", "/results/demo"):
        try:
            urllib.request.urlopen(f"{base}{path}", timeout=120)
        except Exception as exc:
            print(f"  warmup {path}: {exc}")


def seed_e2e():
    root = os.path.dirname(BASE_DIR)
    print("Seeding E2E fixtures…")
    proc = subprocess.run(
        ["npm", "run", "seed:e2e"],
        cwd=root,
        capture_output=True,
        text=True,
        shell=os.name == "nt",
    )
    if proc.returncode != 0:
        print(proc.stderr or proc.stdout or "seed:e2e failed")
        sys.exit(proc.returncode)


def main():
    seed_e2e()
    print("Warming up dev server routes…")
    warmup()
    files = sorted(glob.glob(os.path.join(BASE_DIR, "TC*.py")))
    results: list[tuple[str, bool, str | None]] = []

    for path in files:
        name = os.path.basename(path)
        proc = subprocess.run(
            [sys.executable, path],
            cwd=BASE_DIR,
            capture_output=True,
            text=True,
            env={**os.environ, "TRSTIT_BASE_URL": os.environ.get("TRSTIT_BASE_URL", "http://localhost:3000")},
        )
        ok = proc.returncode == 0
        err = (proc.stderr or proc.stdout or "").strip() or None
        if ok:
            err = None
        results.append((name, ok, err))

    passed = sum(1 for _, ok, _ in results if ok)
    failed = len(results) - passed
    print(f"\n{passed}/{len(results)} passed, {failed} failed\n")
    for name, ok, err in results:
        status = "PASS" if ok else "FAIL"
        print(f"  [{status}] {name}")
        if err:
            for line in err.splitlines()[-6:]:
                print(f"         {line}")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
