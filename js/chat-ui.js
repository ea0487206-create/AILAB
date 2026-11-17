// ===== LabChat: واجهة شات جاهزة تستخدمها المحطات 1 و2 و3 و5 =====
// الاستخدام: const chat = LabChat({ mount:"#chat", system:"...", welcome:"...", onBot:fn });
window.LabChat = function (opt) {
  const root = typeof opt.mount === "string" ? document.querySelector(opt.mount) : opt.mount;
  root.classList.add("lc");
  root.innerHTML =
    '<div class="lc-msgs"></div>' +
    '<div class="lc-form">' +
    '<textarea class="lc-input" rows="1" placeholder="' + (opt.placeholder || "اكتب هنا...") + '"></textarea>' +
    '<button class="lc-send" type="button">إرسال</button>' +
    "</div>";

  const msgs = root.querySelector(".lc-msgs");
  const input = root.querySelector(".lc-input");
  const sendBtn = root.querySelector(".lc-send");
  const history = [];
  let busy = false;

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  // تنسيق بسيط: كتل كود + نص عريض + كود سطري
  function fmt(t) {
    t = esc(t);
    t = t.replace(/```[a-zA-Z]*\n?([\s\S]*?)```/g, (m, c) => "<pre>" + c.trim() + "</pre>");
    t = t.replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>");
    t = t.replace(/`([^`\n]+)`/g, "<code>$1</code>");
    return t;
  }
  function add(html, who) {
    const d = document.createElement("div");
    d.className = "lc-m " + who;
    d.innerHTML = html;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }

  if (opt.welcome) add(fmt(opt.welcome), "bot");

  async function send(text) {
    text = (text === undefined ? input.value : text).trim();
    if (!text || busy) return;
    busy = true;
    input.value = "";
    add(esc(text), "me");
    const bubble = add("...", "bot");
    history.push({ role: "user", parts: [{ text }] });
    try {
      const reply = await AI.ask({
        system: opt.system,
        history,
        maxTokens: opt.maxTokens || 900,
        onChunk: (t) => { bubble.innerHTML = fmt(t); msgs.scrollTop = msgs.scrollHeight; }
      });
      history.push({ role: "model", parts: [{ text: reply }] });
      bubble.innerHTML = fmt(reply);
      if (opt.onBot) opt.onBot({ question: text, answer: reply, bubble });
    } catch (e) {
      history.pop();
      bubble.textContent = e.message;
    }
    busy = false;
    msgs.scrollTop = msgs.scrollHeight;
  }

  sendBtn.onclick = () => send();
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  });

  return { send, history, add };
};
