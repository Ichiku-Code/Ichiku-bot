import pathlib
import signal
import subprocess
import time

try:
    output = subprocess.check_output("netstat -ano | findstr :8080", shell=True).decode(
        "gbk", errors="ignore"
    )
    pids = {line.split()[-1] for line in output.strip().splitlines() if "LISTENING" in line}
    for pid in pids:
        subprocess.run(f"taskkill /F /PID {pid}", shell=True, check=True)
except Exception:  # noqa: BLE001, S110
    pass


cwd = pathlib.Path.cwd()

processes = [
    subprocess.Popen(
        args=args,
        cwd=cwd,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP,
        stdin=subprocess.DEVNULL,
    )
    for args, cwd in (
        (["npm.cmd", "run", "start"], cwd),
        (["cmd.exe", "/c", "launcher-user.bat", "3921133911"], cwd / "NapCat"),
    )
]


try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    for p in processes:
        if p.poll() is None:
            p.send_signal(signal.CTRL_BREAK_EVENT)
            p.wait()
