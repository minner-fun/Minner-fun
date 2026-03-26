找BotFather，创建好机器人后，获取机器人token类似：888888:fdsdfdfdfdf
然后首先要给机器人发送一个消息。
然后访问，这个地址获取chai_id
https://api.telegram.org/bot[token]/getUpdates

```python
import os
import requests
from pathlib import Path
from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parents[2] / ".env")


BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "")

def send_telegram_message(text: str):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": CHAT_ID,
        "text": text,
    }
    resp = requests.post(url, json=payload, timeout=10)
    resp.raise_for_status()
    return resp.json()

send_telegram_message("测试消息：策略已启动")
```