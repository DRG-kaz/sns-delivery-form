import { useState, useRef } from "react";

const GAS_URL = "https://script.google.com/macros/s/AKfycbzxOAi-uOAxiyzvjtGZZdQvtTGBzzP2fbuTKvmtYtlQv4nBH2qLkjNONdWBNCiVBgdAYA/exec";

const MEDIA_OPTIONS = [
  { id: "line",      label: "LINE",        icon: "💬", color: "#06C755" },
  { id: "instagram", label: "Instagram",   icon: "📸", color: "#E1306C" },
  { id: "x",         label: "X (Twitter)", icon: "✖",  color: "#1a1a1a" },
  { id: "threads",   label: "Threads",     icon: "🧵", color: "#444" },
  { id: "google",    label: "Google",      icon: "🔍", color: "#4285F4" },
  { id: "app",       label: "店舗公式アプリ", icon: "📱", color: "#FF6B35" },
];

const initialForm = {
  name: "",
  email: "",
  media: [],
  content: "",
  targetAudience: "",
  eventStart: "",
  eventEnd: "",
  deliveryDate: "",
  deliveryTime: "",
  notes: "",
  files: [],
};

// ファイルをBase64に変換
const toBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result.split(",")[1]);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export default function App() {
  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [managementNo, setManagementNo] = useState("");
  const fileInputRef = useRef();

  const toggleMedia = (id) => {
    setForm(f => ({
      ...f,
      media: f.media.includes(id) ? f.media.filter(m => m !== id) : [...f.media, id],
    }));
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setForm(f => ({ ...f, files: [...f.files, ...newFiles] }));
    e.target.value = "";
  };

  const removeFile = (index) => {
    setForm(f => ({ ...f, files: f.files.filter((_, i) => i !== index) }));
  };

  const validate = () => {
    if (!form.name.trim()) return "お名前を入力してください";
    if (!form.email.trim()) return "メールアドレスを入力してください";
    if (form.media.length === 0) return "配信媒体を1つ以上選択してください";
    if (!form.content.trim()) return "配信内容を入力してください";
    if (!form.deliveryDate) return "配信希望日を入力してください";
    return "";
  };

  const handleNext = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setStep(2);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const mediaLabels = form.media.map(id => MEDIA_OPTIONS.find(m => m.id === id)?.label).join(", ");
      const submittedAt = new Date().toLocaleString("ja-JP");

      // テキストデータをGETで送信
      const textPayload = {
        name: form.name,
        email: form.email,
        media: mediaLabels,
        content: form.content,
        targetAudience: form.targetAudience,
        eventPeriod: form.eventStart ? `${form.eventStart}〜${form.eventEnd || ""}` : "",
        deliveryDateTime: `${form.deliveryDate} ${form.deliveryTime}`.trim(),
        notes: form.notes,
        submittedAt,
      };

      const params = encodeURIComponent(JSON.stringify(textPayload));
      await fetch(`${GAS_URL}?data=${params}`, {
        method: "GET",
        mode: "no-cors",
      });

      // ファイルがあればPOSTで別送
      if (form.files.length > 0) {
        const filesData = await Promise.all(
          form.files.map(async (file) => ({
            name: file.name,
            mimeType: file.type,
            data: await toBase64(file),
          }))
        );
        const filePayload = {
          type: "files",
          email: form.email,
          submittedAt,
          files: filesData,
        };
        await fetch(GAS_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(filePayload),
        });
      }

      setStep(3);
      window.scrollTo(0, 0);
    } catch (e) {
      setError("送信に失敗しました。もう一度お試しください。");
    }
    setSubmitting(false);
  };

  const reset = () => { setForm(initialForm); setStep(1); setError(""); setManagementNo(""); };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f5f4f0",
      fontFamily: "'Noto Sans JP', 'Hiragino Sans', sans-serif",
      padding: "32px 16px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
        input, textarea { transition: border-color 0.2s, box-shadow 0.2s; }
        input:focus, textarea:focus {
          outline: none;
          border-color: #2d6a4f !important;
          box-shadow: 0 0 0 3px rgba(45,106,79,0.12);
        }
        .media-btn:hover { transform: translateY(-1px); }
        .submit-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .file-drop:hover { border-color: #2d6a4f !important; background: #f0fff4 !important; }
      `}</style>

      <div style={{ maxWidth: 600, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "#fff", padding: "10px 24px", borderRadius: 40,
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: 16,
          }}>
            <span style={{ fontSize: 22 }}>📡</span>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a", letterSpacing: "0.5px" }}>
              SNS・媒体 配信依頼フォーム
            </span>
          </div>
          <div style={{ color: "#888", fontSize: 13 }}>必要事項を入力して送信してください</div>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 28 }}>
          {[["1", "入力"], ["2", "確認"], ["3", "完了"]].map(([num, label], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  background: step > i + 1 ? "#2d6a4f" : step === i + 1 ? "#2d6a4f" : "#ddd",
                  color: step >= i + 1 ? "#fff" : "#999",
                  fontWeight: 700, fontSize: 13,
                }}>
                  {step > i + 1 ? "✓" : num}
                </div>
                <span style={{ fontSize: 12, color: step >= i + 1 ? "#2d6a4f" : "#aaa", fontWeight: step === i + 1 ? 700 : 400 }}>
                  {label}
                </span>
              </div>
              {i < 2 && <div style={{ width: 32, height: 1, background: step > i + 1 ? "#2d6a4f" : "#ddd" }} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{
          background: "#fff", borderRadius: 20,
          boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
          padding: "32px 28px",
        }}>

          {/* === STEP 1: 入力 === */}
          {step === 1 && (
            <div>
              <Section title="👤 依頼者情報">
                <Field label="お名前 *">
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="山田 太郎" style={inputStyle} />
                </Field>
                <Field label="メールアドレス *">
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="taro@example.com" style={inputStyle} />
                </Field>
              </Section>

              <Section title="📡 配信媒体 *">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {MEDIA_OPTIONS.map(m => (
                    <button key={m.id} className="media-btn"
                      onClick={() => toggleMedia(m.id)}
                      style={{
                        padding: "8px 16px", borderRadius: 24, border: "2px solid",
                        borderColor: form.media.includes(m.id) ? m.color : "#e0e0e0",
                        background: form.media.includes(m.id) ? m.color : "#fff",
                        color: form.media.includes(m.id) ? "#fff" : "#555",
                        fontWeight: 600, fontSize: 13, cursor: "pointer",
                        transition: "all 0.2s", fontFamily: "inherit",
                      }}>
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="📝 配信内容">
                <Field label="配信テキスト *">
                  <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    placeholder="配信したい内容を入力してください（キャンペーン情報、お知らせ、など）"
                    rows={5} style={{ ...inputStyle, resize: "vertical" }} />
                </Field>
                <Field label="ターゲット・対象者（任意）">
                  <input value={form.targetAudience} onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))}
                    placeholder="例：30代女性、会員全員、近隣住民" style={inputStyle} />
                </Field>
              </Section>

              <Section title="📆 イベント・キャンペーン期間（任意）">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="開始日">
                    <input type="date" value={form.eventStart} onChange={e => setForm(f => ({ ...f, eventStart: e.target.value }))}
                      style={inputStyle} />
                  </Field>
                  <Field label="終了日">
                    <input type="date" value={form.eventEnd} onChange={e => setForm(f => ({ ...f, eventEnd: e.target.value }))}
                      style={inputStyle} />
                  </Field>
                </div>
              </Section>

              <Section title="📅 配信希望日時">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="日付 *">
                    <input type="date" value={form.deliveryDate} onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))}
                      style={inputStyle} />
                  </Field>
                  <Field label="時間（任意）">
                    <input type="time" value={form.deliveryTime} onChange={e => setForm(f => ({ ...f, deliveryTime: e.target.value }))}
                      style={inputStyle} />
                  </Field>
                </div>
              </Section>

              <Section title="📎 ファイル添付（任意）">
                <div className="file-drop"
                  onClick={() => fileInputRef.current.click()}
                  style={{
                    border: "2px dashed #d0d0d0", borderRadius: 10,
                    padding: "20px", textAlign: "center", cursor: "pointer",
                    background: "#fafafa", transition: "all 0.2s", marginBottom: 10,
                  }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>📁</div>
                  <div style={{ color: "#888", fontSize: 13 }}>クリックしてファイルを選択</div>
                  <div style={{ color: "#bbb", fontSize: 11, marginTop: 4 }}>画像・PDF・Word・Excel など対応</div>
                  <input ref={fileInputRef} type="file" multiple onChange={handleFileChange}
                    style={{ display: "none" }} />
                </div>
                {form.files.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {form.files.map((file, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "8px 12px", borderRadius: 8,
                        background: "#f0fff4", border: "1px solid #b7e4c7",
                      }}>
                        <span style={{ fontSize: 13, color: "#2d6a4f" }}>📄 {file.name}</span>
                        <button onClick={() => removeFile(i)} style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: "#999", fontSize: 16, padding: "0 4px",
                        }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              <Section title="💬 備考・その他（任意）">
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="特記事項など"
                  rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              </Section>

              {error && <ErrorMsg msg={error} />}

              <button onClick={handleNext} className="submit-btn" style={{
                width: "100%", padding: "14px", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #2d6a4f, #40916c)",
                color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer",
                marginTop: 8, transition: "all 0.2s", fontFamily: "inherit",
                boxShadow: "0 4px 16px rgba(45,106,79,0.3)",
              }}>
                確認画面へ →
              </button>
            </div>
          )}

          {/* === STEP 2: 確認 === */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", marginBottom: 20, marginTop: 0 }}>
                📋 入力内容の確認
              </h2>
              {[
                ["お名前", form.name],
                ["メールアドレス", form.email],
                ["配信媒体", form.media.map(id => MEDIA_OPTIONS.find(m => m.id === id)?.label).join("、")],
                ["配信テキスト", form.content],
                ["ターゲット", form.targetAudience || "（未入力）"],
                ["イベント期間", form.eventStart ? `${form.eventStart}〜${form.eventEnd || "未定"}` : "（未入力）"],
                ["配信希望日時", `${form.deliveryDate}${form.deliveryTime ? " " + form.deliveryTime : ""}`],
                ["添付ファイル", form.files.length > 0 ? form.files.map(f => f.name).join("、") : "（なし）"],
                ["備考", form.notes || "（未入力）"],
              ].map(([label, value], i) => (
                <div key={i} style={{
                  padding: "12px 0", borderBottom: "1px solid #f0f0f0",
                  display: "grid", gridTemplateColumns: "130px 1fr", gap: 12,
                }}>
                  <div style={{ color: "#888", fontSize: 13, fontWeight: 500 }}>{label}</div>
                  <div style={{ color: "#1a1a1a", fontSize: 14, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{value}</div>
                </div>
              ))}

              {error && <ErrorMsg msg={error} />}

              <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                <button onClick={() => setStep(1)} style={{
                  flex: 1, padding: "13px", borderRadius: 12,
                  border: "2px solid #e0e0e0", background: "#fff",
                  color: "#555", fontSize: 15, fontWeight: 600, cursor: "pointer",
                  fontFamily: "inherit",
                }}>← 修正する</button>
                <button onClick={handleSubmit} disabled={submitting} className="submit-btn" style={{
                  flex: 2, padding: "13px", borderRadius: 12, border: "none",
                  background: submitting ? "#ccc" : "linear-gradient(135deg, #2d6a4f, #40916c)",
                  color: "#fff", fontSize: 15, fontWeight: 700,
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontFamily: "inherit", transition: "all 0.2s",
                  boxShadow: submitting ? "none" : "0 4px 16px rgba(45,106,79,0.3)",
                }}>
                  {submitting ? "送信中..." : "✅ この内容で送信する"}
                </button>
              </div>
            </div>
          )}

          {/* === STEP 3: 完了 === */}
          {step === 3 && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#2d6a4f", marginBottom: 12 }}>
                依頼を受け付けました！
              </h2>
              <div style={{
                display: "inline-block",
                background: "linear-gradient(135deg, #2d6a4f, #40916c)",
                color: "#fff", borderRadius: 12, padding: "12px 32px",
                marginBottom: 20,
              }}>
                <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 4 }}>管理番号</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>受付メールをご確認ください</div>
              </div>
              <p style={{ color: "#666", fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
                ご依頼ありがとうございます。<br />
                内容を確認次第、担当者よりご連絡いたします。
              </p>
              <button onClick={reset} style={{
                padding: "12px 32px", borderRadius: 24, border: "2px solid #2d6a4f",
                background: "#fff", color: "#2d6a4f", fontSize: 14, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                新しい依頼を入力する
              </button>
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", color: "#bbb", fontSize: 11, marginTop: 20, lineHeight: 1.8 }}>
          ※ このフォームは社内限定です<br />
          開発・管理：マーケティング部 山﨑一輝
        </p>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 8,
  border: "2px solid #e8e8e8", fontSize: 14, color: "#1a1a1a",
  background: "#fafafa", fontFamily: "inherit",
};

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a", marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 6, fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );
}

function ErrorMsg({ msg }) {
  return (
    <div style={{
      padding: "10px 14px", borderRadius: 8, background: "#fff5f5",
      border: "1px solid #ffcccc", color: "#cc0000", fontSize: 13, marginBottom: 12,
    }}>
      ⚠️ {msg}
    </div>
  );
}
