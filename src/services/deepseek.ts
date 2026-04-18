// AI 服务
// 文字对话：豆包 ARK API（国内稳定）
// 图像生成：Gemini Imagen（备用）

// ── 豆包配置 ─────────────────────────────────────────────────
const ARK_KEY = 'ark-e2782fee-7520-40f3-9ce1-71d0e54316c9-c2327'
const ARK_BASE = 'https://ark.cn-beijing.volces.com/api/v3'
const ARK_MODEL = 'doubao-seed-1-8-251228'


export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// ── 单次文字对话 ──────────────────────────────────────────────
export async function chat(messages: Message[]): Promise<string> {
  const res = await fetch(`${ARK_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ARK_KEY}`,
    },
    body: JSON.stringify({
      model: ARK_MODEL,
      messages,
      temperature: 0.9,
      max_tokens: 600,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`ARK chat error: ${res.status} ${err}`)
  }
  const data = await res.json()
  return data.choices[0].message.content as string
}

// ── 流式文字对话（灯塔守护者）────────────────────────────────
export async function chatStream(
  messages: Message[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (e: Error) => void
) {
  try {
    const res = await fetch(`${ARK_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ARK_KEY}`,
      },
      body: JSON.stringify({
        model: ARK_MODEL,
        messages,
        temperature: 0.9,
        max_tokens: 600,
        stream: true,
      }),
    })
    if (!res.ok || !res.body) throw new Error(`ARK stream error: ${res.status}`)

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
      for (const line of lines) {
        const data = line.slice(6).trim()
        if (data === '[DONE]') { onDone(); return }
        try {
          const json = JSON.parse(data)
          const text = json.choices?.[0]?.delta?.content
          if (text) onChunk(text)
        } catch { /* skip */ }
      }
    }
    onDone()
  } catch (e) {
    onError(e as Error)
  }
}

// ── 图像生成（豆包 doubao-seedream-4-0）──────────────────────
export async function generateImage(prompt: string): Promise<string> {
  const res = await fetch(`${ARK_BASE}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ARK_KEY}`,
    },
    body: JSON.stringify({
      model: 'doubao-seedream-4-0-250828',
      prompt,
      response_format: 'url',
      size: '1024x1024',
      stream: false,
      watermark: false,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`豆包图像生成错误: ${res.status} ${err}`)
  }
  const data = await res.json()
  const url = data.data?.[0]?.url
  if (!url) throw new Error('No image URL returned')
  return url
}
