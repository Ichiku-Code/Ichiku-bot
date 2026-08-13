import pathlib
import signal
import subprocess
import time

import tomllib

with open('env.toml', 'rb') as f:
    env = tomllib.load(f)
    port = env['port']
    qq = env['qq']['id']

try:
    output = subprocess.check_output(f'netstat -ano | findstr :{port}', shell=True).decode('gbk', errors='ignore')
    pids = {line.split()[-1] for line in output.strip().splitlines() if 'LISTENING' in line}
    for pid in pids:
        subprocess.run(f'taskkill /F /PID {pid}', shell=True, check=True)
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
        (['npm.cmd', 'run', 'start'], cwd),
        (['cmd.exe', '/c', 'launcher-user.bat', str(qq)], cwd / 'NapCat'),
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
