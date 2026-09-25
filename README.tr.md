<div align="center">

# Vision Universal AI

<p align="center">
  <a href="README.md"><b>English</b></a> | <a href="README.tr.md"><b>Türkçe</b></a>
</p>

### **Tek Bir SDK. Tüm Yapay Zeka Modelleri.**

*TypeScript ve JavaScript için birleşik, kurumsal düzeyde, açık kaynaklı Evrensel Yapay Zeka SDK'sı.*

[![npm version](https://img.shields.io/npm/v/vision-universal-ai.svg?style=flat-square&color=blue)](https://www.npmjs.com/package/vision-universal-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript: Strict](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Node: 18+](https://img.shields.io/badge/Node.js-18%2B%20%7C%20Edge%20%7C%20Bun%20%7C%20Deno-brightgreen?style=flat-square)](https://nodejs.org)
[![Tests: 31/31 Passed](https://img.shields.io/badge/Tests-31%2F31%20Passing-success.svg?style=flat-square)](https://github.com/berkaysahin-dev/vision-universal-ai)
[![Zero Dependencies](https://img.shields.io/badge/Runtime%20Deps-Zero-orange?style=flat-square)](https://github.com/berkaysahin-dev/vision-universal-ai)

[Özellikler](#özellikler) • [Desteklenen Sağlayıcılar](#desteklenen-sağlayıcılar) • [Hızlı Başlangıç](#hızlı-başlangıç) • [Akış (Streaming)](#gerçek-zamanlı-akış-streaming) • [Araç Çağırma](#otonom-çok-adımlı-araç-çağırma-tool-calling) • [Yapılandırılmış Çıktı](#kesin-yapılandırılmış-çıktı-json-şeması) • [Model Yönlendirme](#model-yönlendirme-ve-sıfır-kesintili-yedekleme) • [CLI](#etkileşimli-terminal-cli) • [Dokümantasyon](#yapılandırma-ve-seçenekler)

---

</div>

## Genel Bakış

**Vision Universal AI**, yapay zeka ekosistemindeki sağlayıcı bağımlılığını (vendor lock-in) ortadan kaldırmak için geliştirilmiş kurumsal düzeyde bir Evrensel Yapay Zeka SDK'sıdır. **Google Gemini, OpenAI, Anthropic Claude, Groq, DeepSeek, OpenRouter, Ollama ve Mistral AI** modellerini tek bir güçlü, kesin tipli (strictly-typed) API altında birleştirir.

Gemini'den OpenAI veya Claude'a geçmek yalnızca tek bir yapılandırma parametresini değiştirmeyi gerektirir. Araçlarınız (tools), streaming akışlarınız, JSON şema çıkarımlarınız ve uygulama mantığınız **%100 aynı kalır**.

```
                    ┌───────────────────────────────┐
                    │       Uygulamanız             │
                    └──────────────┬────────────────┘
                                   │
                    import { VisionAI } from "vision-universal-ai"
                                   │
                    ┌──────────────▼────────────────┐
                    │    Vision Universal AI SDK    │
                    │   Pipeline • Retry • Router   │
                    └──────┬───┬───┬───┬───┬───┬───┬┘
                           │   │   │   │   │   │   │
        ┌──────────────────┼───┼───┼───┼───┼───┼───┼──────────────────┐
        │                  │   │   │   │   │   │   │                  │
  ┌─────▼─────┐      ┌─────▼───▼┐ ┌▼───▼─────┐ ┌───▼───────┐      ┌─────▼─────┐
  │  Gemini   │      │  OpenAI  │ │Anthropic │ │ DeepSeek  │      │  Ollama   │
  │2.0 / Flash│      │GPT-4o/o3 │ │Claude 3.5│ │ V3 / R1   │      │  (Yerel)  │
  └───────────┘      └──────────┘ └──────────┘ └───────────┘      └───────────┘
```

---

## Özellikler

- **Evrensel Sağlayıcı Mimarisi**: Başlıca tüm bulut ve yerel LLM'ler arasında anında dinamik geçiş (hot-swapping).
- **Yerel Streaming (Akış)**: Standart `AsyncIterable<AIChunk>` ve Web standardı `ReadableStream` ile gerçek zamanlı token teslimi.
- **Otonom Çok Adımlı Araç Çağrısı (Tool Calling)**: Fonksiyonları yürüten, sonuçları modele geri aktaran ve nihai cevaba ulaşana kadar yineleyen otomatik özyinelemeli döngü.
- **Kesin Yapılandırılmış Çıktılar (Structured Outputs)**: Markdown kod bloklarından otomatik ayıklama ile JSON Şema doğrulaması.
- **Çok Modlu (Multimodal)**: Desteklenen modellerde metin, görsel (URL & Base64), ses ve dokümanlar için yerel destek.
- **Sıfır Kesinti ile Model Yönlendirme (Routing & Fallback)**: 429 Hız Limiti veya 5xx sunucu hatalarında otomatik yedek modele geçen yüksek erişilebilirlikli mimari.
- **Düşünce Zinciri Tokenları (Reasoning Tokens)**: DeepSeek-R1, OpenAI o1/o3-mini ve Gemini Thinking modellerinin düşünce zincirini doğrudan `response.reasoningContent` ile yakalama.
- ⏱ **Üretim Seviyesi Dayanıklılık**: Full-jitter üstel geri çekilme (exponential backoff), istek bazlı zaman aşımları ve istek iptal desteği.
- **Normalize Edilmiş Token Takibi**: Tüm sağlayıcılarda standartlaştırılmış `promptTokens`, `completionTokens` ve `totalTokens` takibi.
- **Sıfır Ek Çalışma Zamanı Yükü (Zero Runtime Overhead)**: Standart `fetch` ve SSE akış ayrıştırıcıları ile sıfır bağımlılık; Node.js 18+, Next.js, Cloudflare Workers, Bun, Deno ve Electron ile tam uyumlu.
- **Etkileşimli Terminal CLI**: `npx vision-ai` ile terminalden doğrudan başlatma, test etme ve sohbet.

---

## Desteklenen Sağlayıcılar

| Sağlayıcı | Sohbet (Chat) | Akış (Streaming) | Araç Çağırma (Tool Calling) | Görsel (Vision) | Yapılandırılmış JSON | Gömme (Embeddings) | Muhakeme (R1/o1) | Varsayılan Model |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Google Gemini** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | `gemini-2.0-flash` |
| **OpenAI** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | `gpt-4o` |
| **Anthropic Claude** | ✔ | ✔ | ✔ | ✔ | ✔ | *(Yok)* | *(Yok)* | `claude-3-5-sonnet-20241022` |
| **Groq** | ✔ | ✔ | ✔ | ✔ | ✔ | *(Yok)* | *(Yok)* | `llama-3.3-70b-versatile` |
| **DeepSeek** | ✔ | ✔ | ✔ | *(Yok)* | ✔ | *(Yok)* | ✔ | `deepseek-chat` |
| **OpenRouter** | ✔ | ✔ | ✔ | ✔ | ✔ | *(Yok)* | ✔ | `meta-llama/llama-3.3-70b-instruct` |
| **Ollama (Yerel)** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | *(Yok)* | `llama3.2` |
| **Mistral AI** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | *(Yok)* | `mistral-large-latest` |

*(Yok: İlgili sağlayıcının API'sinde o uç noktanın bulunmadığını gösterir. Desteklenmeyen bir çağrı yapıldığında anlaşılır bir `CapabilityNotSupportedError` hatası fırlatılır.)*

---

## Kurulum
```bash
npm install vision-universal-ai
```

veya yarn, pnpm ya da bun ile:
```bash
pnpm add vision-universal-ai
bun add vision-universal-ai
```

---

## Hızlı Başlangıç

Yalnızca 3 satır kod ile çalışan bir yanıt alın:
```ts
import { VisionAI } from "vision-universal-ai";

const ai = new VisionAI({
  provider: "gemini",
  apiKey: process.env.GEMINI_API_KEY
});

const response = await ai.chat("Kuantum dolanıklığını basit terimlerle açıkla.");
console.log(response.text);
```

---

## Sağlayıcı Değiştirme

Model değiştirmek yalnızca `provider` adını değiştirmeyi gerektirir. Diğer her şey tamamen aynı kalır:
```ts
// OpenAI
const ai = new VisionAI({ provider: "openai", apiKey: process.env.OPENAI_API_KEY });

// Anthropic Claude
const ai = new VisionAI({ provider: "anthropic", apiKey: process.env.ANTHROPIC_API_KEY });

// Groq (Ultra düşük gecikme)
const ai = new VisionAI({ provider: "groq", apiKey: process.env.GROQ_API_KEY });

// DeepSeek (V3 / R1 Muhakeme)
const ai = new VisionAI({ provider: "deepseek", apiKey: process.env.DEEPSEEK_API_KEY });

// Yerel Ollama (API Anahtarı gerektirmez)
const ai = new VisionAI({ provider: "ollama", baseUrl: "http://localhost:11434" });

// Mistral AI
const ai = new VisionAI({ provider: "mistral", apiKey: process.env.MISTRAL_API_KEY });
```

---

## Gerçek Zamanlı Akış (Streaming)

Standart `for await...of` ile tokenları gerçek zamanlı akıtın:
```ts
import { VisionAI } from "vision-universal-ai";

const ai = new VisionAI({ provider: "gemini" });
const stream = await ai.stream("Yapay zeka hakkında etkileyici bir kısa hikaye yaz.");

for await (const chunk of stream) {
  process.stdout.write(chunk.delta);
}

// Akış bittiğinde birleştirilmiş meta verileri alın:
const finalResponse = await stream.getFinalResponse();
console.log("\nKullanılan toplam token:", finalResponse.usage?.totalTokens);
```

---

## Otonom Çok Adımlı Araç Çağırma (Tool Calling)

Standart JavaScript fonksiyonlarını araç olarak tanımlayın. Vision Universal AI, araç isteklerini otomatik olarak çalıştırır ve nihai sonuca ulaşana kadar sonuçları modele iletir:
```ts
import { VisionAI, type AITool } from "vision-universal-ai";

const weatherTool: AITool<{ city: string }> = {
  name: "get_weather",
  description: "Belirli bir şehir için gerçek zamanlı hava durumu bilgisini getirir.",
  parameters: {
    type: "object",
    properties: {
      city: { type: "string", description: "Şehir adı, örn. Istanbul" }
    },
    required: ["city"]
  },
  execute: async ({ city }) => {
    return { city, temperature: 22, condition: "Güneşli ve açık" };
  }
};

const ai = new VisionAI({ provider: "openai" });

const response = await ai.chat({
  prompt: "Şu anda İstanbul'da hava nasıl?",
  tools: [weatherTool]
});

console.log(response.text);
// "İstanbul'da şu an hava güneşli ve açık, sıcaklık 22°C."
```

---

## Kesin Yapılandırılmış Çıktı (JSON Şeması)

Kesin tipli ve doğrulanmış JSON veri yapıları elde edin:
```ts
import { VisionAI } from "vision-universal-ai";

interface ProductItem {
  id: string;
  name: string;
  price: number;
  tags: string[];
  inStock: boolean;
}

const ai = new VisionAI({ provider: "gemini" });

const result = await ai.generate<ProductItem>({
  prompt: "Yüksek performanslı bir kuantum iş istasyonu özellikleri oluştur.",
  responseFormat: {
    type: "json",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        price: { type: "number" },
        tags: { type: "array", items: { type: "string" } },
        inStock: { type: "boolean" }
      },
      required: ["id", "name", "price", "tags", "inStock"]
    }
  }
});

console.log(result.data.name);    // Tip güvenli string
console.log(result.data.price);   // Tip güvenli number
console.log(result.data.inStock); // Tip güvenli boolean
```

---

## Model Yönlendirme ve Sıfır Kesintili Yedekleme

Üretim uygulamalarınızı 429 Hız Limitlerine ve 5xx sunucu kesintilerine karşı esnek yedekleme zincirleriyle koruyun:
```ts
import { VisionAI } from "vision-universal-ai";

const ai = new VisionAI({
  routing: {
    default: "gemini",
    fallback: ["openai", "anthropic", "groq"],
    fallbackOnRateLimit: true,
    fallbackOnServerError: true,
    onFallback: ({ failedProvider, error, nextProvider, attempt }) => {
      console.warn(`[Yedekleme] ${failedProvider} başarısız oldu (${error.message}). ${nextProvider} sağlayıcısına geçiliyor...`);
    }
  }
});

// Google Gemini kota sınırına takılırsa veya 503 verirse,
// SDK otomatik olarak sırayla OpenAI ve Claude'a yönlendirir.
const response = await ai.chat("Kritik iş analitiğini işle.");
```

---

## Düşünce Zinciri Tokenları (DeepSeek-R1, o1, o3-mini)

Ham düşünce süreci (chain-of-thought) muhakeme tokenlarına doğrudan erişin:
```ts
const ai = new VisionAI({ provider: "deepseek", defaultModel: "deepseek-reasoner" });
const response = await ai.chat("Bu karmaşık mantık bulmacasını çöz.");

console.log("=== DÜŞÜNCE SÜRECİ ===");
console.log(response.reasoningContent);

console.log("\n=== NİHAİ YANIT ===");
console.log(response.text);
```

---

## Çok Modlu (Görsel ve Dosyalar)

Uzak URL'lerden veya Base64 tamponlarından görselleri analiz edin:
```ts
const response = await ai.chat({
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "Bu fotoğrafta ne tasvir edildiğini açıkla." },
        { type: "image", image: "https://example.com/satellite.jpg" }
      ]
    }
  ]
});
```

---

## Hata Yönetimi

Tüm SDK hataları normalize edilmiş HTTP durum kodları ve sağlayıcı bağlamı ile `VisionAIError` sınıfından türetilir:
```ts
import {
  VisionAI,
  VisionAIError,
  AuthenticationError,
  RateLimitError,
  TimeoutError,
  CapabilityNotSupportedError
} from "vision-universal-ai";

try {
  const response = await ai.chat("...");
} catch (error) {
  if (error instanceof RateLimitError) {
    console.error(`Sağlayıcıda hız limiti aşıldı: ${error.provider}`);
  } else if (error instanceof AuthenticationError) {
    console.error(`Geçersiz API anahtarı: ${error.provider}`);
  } else if (error instanceof CapabilityNotSupportedError) {
    console.error(`Özellik desteklenmiyor: ${error.message}`);
  } else if (error instanceof VisionAIError) {
    console.error(`[${error.provider}] Durum ${error.statusCode}: ${error.message}`);
  }
}
```

---

## Yapılandırma ve Seçenekler
```ts
const ai = new VisionAI({
  provider: "gemini",              // Aktif varsayılan sağlayıcı
  apiKey: process.env.API_KEY,     // Açık API anahtarı (veya ortam değişkeninden okur)
  baseUrl: "https://custom-proxy", // Özel proxy uç noktası
  defaultModel: "gemini-2.0-flash",// Model ezme (override)
  timeoutMs: 30000,                // Milisaniye cinsinden zaman aşımı (varsayılan: 60000ms)
  maxRetries: 3                    // Üstel geri çekilme deneme sayısı (varsayılan: 3)
});
```

---

## Özel Sağlayıcılar (Custom Providers)

Herhangi bir özel dahili kurumsal LLM'i yaklaşık 20 satırda ekleyin:
```ts
import { VisionAI, type AIProvider } from "vision-universal-ai";

class MyEnterpriseLLM implements AIProvider {
  public readonly name = "enterprise-ai";
  public readonly displayName = "Enterprise AI";
  public readonly defaultModel = "v1";
  public readonly capabilities = {
    chat: true, stream: true, tools: false, vision: false,
    audioInput: false, pdfInput: false, jsonSchema: true,
    embeddings: false, imageGeneration: false, speechToText: false, textToSpeech: false
  };

  async chat(options) {
    const res = await fetch("https://internal-llm.corp.local/v1/chat", { ... });
    return { text: "...", provider: this.name, model: this.defaultModel };
  }

  async *stream(options) {
    // AIChunk nesneleri döndürür
  }
}

const ai = new VisionAI();
ai.register(new MyEnterpriseLLM());
```

---

## Etkileşimli Terminal CLI

Vision Universal AI yerleşik bir terminal CLI aracı ile birlikte gelir:
```bash
# Yeni bir yapılandırma dosyası ve .env şablonu oluşturun
npx vision-ai init

# Terminalde etkileşimli bir streaming sohbet oturumu başlatın
npx vision-ai chat gemini

# Tüm yapılandırılmış sağlayıcı anahtarlarının bağlantısını test edin
npx vision-ai test

# Model profillerini ve sağlayıcı anahtar durumlarını listeleyin
npx vision-ai models
```

---

## Testler

Vision Universal AI %100 deterministik bir test paketi içerir:
```bash
# Birim ve entegrasyon testlerini çalıştırın
npm test

# Testleri izleme (watch) modunda çalıştırın
npm run test:watch

# Kapsam (coverage) raporu oluşturun
npm run test:coverage
```

---

## Yol Haritası

- [x] Evrensel Çekirdek Motor (Yeniden Deneme, Yönlendirme, Araçlar, Akış, Normalizasyon)
- [x] 8 Üretim Seviyesi Adaptör (Gemini, OpenAI, Anthropic, Groq, DeepSeek, OpenRouter, Ollama, Mistral)
- [x] Kesin TypeScript tanımları ve ESM/CJS çift derleme
- [x] Tam birim ve entegrasyon test kapsamı (31/31 başarılı)
- [ ] Cohere ve Perplexity sağlayıcı adaptörleri
- [ ] Next.js AI SDK React Server Component akış uyumluluk adaptörü
- [ ] Vektör Veritabanı bağlayıcıları (Pinecone, Qdrant, Chroma)

---

## Katkıda Bulunma

Topluluk katkılarını memnuniyetle karşılıyoruz! Lütfen pull request göndermeden önce [CONTRIBUTING.md](./CONTRIBUTING.md) ve [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) belgelerini inceleyin.

---

## Lisans

Vision Universal AI, [MIT Lisansı](./LICENSE) altında lisanslanmış açık kaynaklı bir yazılımdır.

---

<div align="center">

**[Shaz Vision](https://shazvision.com)** • *Geleceği Akılla İnşa Ediyoruz*

</div>
