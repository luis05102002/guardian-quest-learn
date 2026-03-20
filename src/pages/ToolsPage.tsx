import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Key, Hash, Lock, Unlock, Eye, EyeOff, AlertTriangle, CheckCircle2, Copy, RefreshCw, Globe, Wifi, Server, ChevronRight } from "lucide-react";
import { toast } from "sonner";

// ─── Password Strength Checker ───
function PasswordChecker() {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const analyze = (pw: string) => {
    const checks = [
      { label: "8+ caracteres", pass: pw.length >= 8 },
      { label: "Mayúsculas", pass: /[A-Z]/.test(pw) },
      { label: "Minúsculas", pass: /[a-z]/.test(pw) },
      { label: "Números", pass: /[0-9]/.test(pw) },
      { label: "Caracteres especiales", pass: /[^A-Za-z0-9]/.test(pw) },
      { label: "12+ caracteres", pass: pw.length >= 12 },
      { label: "Sin patrones comunes", pass: !/^(123|abc|password|qwerty|admin)/i.test(pw) },
    ];
    const score = checks.filter(c => c.pass).length;
    const level = score <= 2 ? "Muy débil" : score <= 3 ? "Débil" : score <= 5 ? "Moderada" : score <= 6 ? "Fuerte" : "Muy fuerte";
    const color = score <= 2 ? "text-destructive" : score <= 3 ? "text-[hsl(var(--cyber-amber))]" : score <= 5 ? "text-[hsl(45,90%,55%)]" : "text-primary";
    const percent = Math.round((score / 7) * 100);

    // Estimate crack time
    const charset = (/[a-z]/.test(pw) ? 26 : 0) + (/[A-Z]/.test(pw) ? 26 : 0) + (/[0-9]/.test(pw) ? 10 : 0) + (/[^A-Za-z0-9]/.test(pw) ? 32 : 0);
    const combos = Math.pow(charset || 1, pw.length);
    const guessesPerSec = 1e10;
    const seconds = combos / guessesPerSec;
    let crackTime = "Instantáneo";
    if (seconds > 3.15e16) crackTime = "Miles de millones de años";
    else if (seconds > 3.15e7) crackTime = `~${Math.round(seconds / 3.15e7)} años`;
    else if (seconds > 86400) crackTime = `~${Math.round(seconds / 86400)} días`;
    else if (seconds > 3600) crackTime = `~${Math.round(seconds / 3600)} horas`;
    else if (seconds > 60) crackTime = `~${Math.round(seconds / 60)} minutos`;
    else if (seconds > 1) crackTime = `~${Math.round(seconds)} segundos`;

    return { checks, score, level, color, percent, crackTime };
  };

  const result = password ? analyze(password) : null;

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Escribe una contraseña para analizar..."
          className="w-full bg-secondary border border-border rounded-lg px-4 py-3 pr-10 text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none font-mono-cyber"
        />
        <button onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {result && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className={`text-sm font-semibold ${result.color}`}>{result.level}</span>
            <span className="text-xs text-muted-foreground font-mono-cyber">{result.percent}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${result.score <= 2 ? 'bg-destructive' : result.score <= 3 ? 'bg-[hsl(var(--cyber-amber))]' : result.score <= 5 ? 'bg-[hsl(45,90%,55%)]' : 'bg-primary'}`}
              style={{ width: `${result.percent}%` }}
            />
          </div>
          <div className="bg-secondary/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Tiempo estimado de crackeo (fuerza bruta a 10B/s):</p>
            <p className={`text-sm font-mono-cyber font-bold ${result.color}`}>{result.crackTime}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {result.checks.map(c => (
              <div key={c.label} className="flex items-center gap-2 text-xs">
                {c.pass ? <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                <span className={c.pass ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Hash Generator ───
function HashGenerator() {
  const [input, setInput] = useState("");
  const [hashes, setHashes] = useState<{ algo: string; hash: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const generateHashes = async () => {
    if (!input) return;
    setLoading(true);
    const algos = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;
    const results: { algo: string; hash: string }[] = [];
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    for (const algo of algos) {
      const hashBuffer = await crypto.subtle.digest(algo, data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      results.push({ algo, hash: hashHex });
    }
    setHashes(results);
    setLoading(false);
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast.success("Hash copiado");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Texto a hashear..."
          className="flex-1 bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
          onKeyDown={e => e.key === "Enter" && generateHashes()}
        />
        <button onClick={generateHashes} disabled={!input || loading}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors active:scale-95 disabled:opacity-50">
          <Hash className="w-4 h-4" />
        </button>
      </div>
      {hashes.length > 0 && (
        <div className="space-y-2 animate-fade-in">
          {hashes.map(h => (
            <div key={h.algo} className="bg-secondary/50 rounded-lg p-3 group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-primary">{h.algo}</span>
                <button onClick={() => copyHash(h.hash)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] font-mono-cyber text-foreground break-all leading-relaxed">{h.hash}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Base64 / Encoding Tools ───
function EncoderDecoder() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"base64" | "url" | "hex" | "binary">("base64");
  const [direction, setDirection] = useState<"encode" | "decode">("encode");

  const process = () => {
    if (!input) return "";
    try {
      if (mode === "base64") {
        return direction === "encode" ? btoa(unescape(encodeURIComponent(input))) : decodeURIComponent(escape(atob(input)));
      }
      if (mode === "url") {
        return direction === "encode" ? encodeURIComponent(input) : decodeURIComponent(input);
      }
      if (mode === "hex") {
        if (direction === "encode") {
          return Array.from(new TextEncoder().encode(input)).map(b => b.toString(16).padStart(2, '0')).join(' ');
        }
        return new TextDecoder().decode(new Uint8Array(input.trim().split(/\s+/).map(h => parseInt(h, 16))));
      }
      if (mode === "binary") {
        if (direction === "encode") {
          return Array.from(new TextEncoder().encode(input)).map(b => b.toString(2).padStart(8, '0')).join(' ');
        }
        return new TextDecoder().decode(new Uint8Array(input.trim().split(/\s+/).map(b => parseInt(b, 2))));
      }
    } catch {
      return "⚠️ Error al procesar. Verifica el formato de entrada.";
    }
    return "";
  };

  const result = process();

  const copyResult = () => {
    if (result && !result.startsWith("⚠️")) {
      navigator.clipboard.writeText(result);
      toast.success("Copiado");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(["base64", "url", "hex", "binary"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors active:scale-95 ${mode === m ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
            {m.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={() => setDirection("encode")}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors active:scale-95 flex items-center justify-center gap-1.5 ${direction === "encode" ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-secondary text-muted-foreground'}`}>
          <Lock className="w-3.5 h-3.5" /> Codificar
        </button>
        <button onClick={() => setDirection("decode")}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors active:scale-95 flex items-center justify-center gap-1.5 ${direction === "decode" ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-secondary text-muted-foreground'}`}>
          <Unlock className="w-3.5 h-3.5" /> Decodificar
        </button>
      </div>
      <textarea value={input} onChange={e => setInput(e.target.value)} rows={3}
        placeholder={direction === "encode" ? "Texto para codificar..." : "Texto codificado para decodificar..."}
        className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none font-mono-cyber resize-none" />
      {result && (
        <div className="bg-secondary/50 rounded-lg p-4 group animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-primary">Resultado</span>
            <button onClick={copyResult} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-sm font-mono-cyber text-foreground break-all leading-relaxed">{result}</p>
        </div>
      )}
    </div>
  );
}

// ─── Password Generator ───
function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({ upper: true, lower: true, numbers: true, symbols: true });
  const [generated, setGenerated] = useState("");

  const generate = useCallback(() => {
    let chars = "";
    if (options.lower) chars += "abcdefghijklmnopqrstuvwxyz";
    if (options.upper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (options.numbers) chars += "0123456789";
    if (options.symbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";
    if (!chars) { chars = "abcdefghijklmnopqrstuvwxyz"; }
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    const pw = Array.from(array, v => chars[v % chars.length]).join('');
    setGenerated(pw);
  }, [length, options]);

  const copy = () => {
    if (generated) {
      navigator.clipboard.writeText(generated);
      toast.success("Contraseña copiada");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="text-xs text-muted-foreground">Longitud: <span className="text-primary font-mono-cyber">{length}</span></label>
        <input type="range" min={8} max={64} value={length} onChange={e => setLength(Number(e.target.value))}
          className="flex-1 accent-primary" />
      </div>
      <div className="flex gap-3 flex-wrap">
        {([
          { key: "upper", label: "ABC" },
          { key: "lower", label: "abc" },
          { key: "numbers", label: "123" },
          { key: "symbols", label: "!@#" },
        ] as const).map(o => (
          <button key={o.key}
            onClick={() => setOptions(p => ({ ...p, [o.key]: !p[o.key] }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono-cyber font-medium transition-colors active:scale-95 ${options[o.key] ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-secondary text-muted-foreground'}`}>
            {o.label}
          </button>
        ))}
      </div>
      <button onClick={generate}
        className="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors active:scale-95 flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4" />
        Generar contraseña segura
      </button>
      {generated && (
        <div className="bg-secondary/50 rounded-lg p-4 group animate-fade-in cursor-pointer" onClick={copy}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Click para copiar</span>
            <Copy className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
          <p className="text-sm font-mono-cyber text-primary font-bold break-all tracking-wider">{generated}</p>
        </div>
      )}
    </div>
  );
}

// ─── Port Reference ───
function PortReference() {
  const [search, setSearch] = useState("");
  const ports = [
    { port: 20, proto: "TCP", service: "FTP (datos)", risk: "alto", desc: "Transferencia de archivos sin cifrar" },
    { port: 21, proto: "TCP", service: "FTP (control)", risk: "alto", desc: "Control de FTP, credenciales en claro" },
    { port: 22, proto: "TCP", service: "SSH", risk: "medio", desc: "Acceso remoto cifrado, blanco de fuerza bruta" },
    { port: 23, proto: "TCP", service: "Telnet", risk: "crítico", desc: "Acceso remoto sin cifrar" },
    { port: 25, proto: "TCP", service: "SMTP", risk: "alto", desc: "Email relay, spam y spoofing" },
    { port: 53, proto: "TCP/UDP", service: "DNS", risk: "alto", desc: "Resolución de nombres, DNS poisoning" },
    { port: 80, proto: "TCP", service: "HTTP", risk: "medio", desc: "Web sin cifrar" },
    { port: 110, proto: "TCP", service: "POP3", risk: "alto", desc: "Email sin cifrar" },
    { port: 135, proto: "TCP", service: "MSRPC", risk: "alto", desc: "RPC de Windows, vector de ataque frecuente" },
    { port: 139, proto: "TCP", service: "NetBIOS", risk: "alto", desc: "Compartir archivos Windows" },
    { port: 143, proto: "TCP", service: "IMAP", risk: "alto", desc: "Email sin cifrar" },
    { port: 443, proto: "TCP", service: "HTTPS", risk: "bajo", desc: "Web cifrado con TLS" },
    { port: 445, proto: "TCP", service: "SMB", risk: "crítico", desc: "Compartir archivos, EternalBlue/WannaCry" },
    { port: 993, proto: "TCP", service: "IMAPS", risk: "bajo", desc: "IMAP cifrado" },
    { port: 995, proto: "TCP", service: "POP3S", risk: "bajo", desc: "POP3 cifrado" },
    { port: 1433, proto: "TCP", service: "MSSQL", risk: "alto", desc: "Base de datos SQL Server" },
    { port: 1521, proto: "TCP", service: "Oracle DB", risk: "alto", desc: "Base de datos Oracle" },
    { port: 3306, proto: "TCP", service: "MySQL", risk: "alto", desc: "Base de datos MySQL/MariaDB" },
    { port: 3389, proto: "TCP", service: "RDP", risk: "crítico", desc: "Escritorio remoto Windows, BlueKeep" },
    { port: 5432, proto: "TCP", service: "PostgreSQL", risk: "alto", desc: "Base de datos PostgreSQL" },
    { port: 5900, proto: "TCP", service: "VNC", risk: "crítico", desc: "Escritorio remoto sin cifrar" },
    { port: 6379, proto: "TCP", service: "Redis", risk: "alto", desc: "Base de datos en memoria, frecuentemente sin auth" },
    { port: 8080, proto: "TCP", service: "HTTP Alt", risk: "medio", desc: "Proxy web o servidor alternativo" },
    { port: 8443, proto: "TCP", service: "HTTPS Alt", risk: "bajo", desc: "HTTPS en puerto alternativo" },
    { port: 27017, proto: "TCP", service: "MongoDB", risk: "alto", desc: "Base de datos NoSQL, frecuentemente sin auth" },
  ];

  const filtered = ports.filter(p =>
    search === "" ||
    p.port.toString().includes(search) ||
    p.service.toLowerCase().includes(search.toLowerCase()) ||
    p.desc.toLowerCase().includes(search.toLowerCase())
  );

  const riskColor = (r: string) =>
    r === "crítico" ? "text-destructive bg-destructive/10" :
    r === "alto" ? "text-[hsl(var(--cyber-amber))] bg-[hsl(var(--cyber-amber))]/10" :
    r === "medio" ? "text-[hsl(45,90%,55%)] bg-[hsl(45,90%,55%)]/10" :
    "text-primary bg-primary/10";

  return (
    <div className="space-y-4">
      <input type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Buscar puerto, servicio..."
        className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none" />
      <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
        {filtered.map(p => (
          <div key={p.port} className="bg-secondary/30 rounded-lg p-3 flex items-start gap-3 hover:bg-secondary/50 transition-colors">
            <div className="text-center shrink-0 w-14">
              <span className="font-mono-cyber text-sm font-bold text-primary">{p.port}</span>
              <span className="block text-[10px] text-muted-foreground">{p.proto}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold text-foreground">{p.service}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${riskColor(p.risk)}`}>
                  {p.risk}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── HTTP Headers Analyzer ───
function HeadersAnalyzer() {
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState<{ name: string; present: boolean; value?: string; importance: string; desc: string }[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  const securityHeaders = [
    { name: "Strict-Transport-Security", importance: "crítico", desc: "Fuerza HTTPS. Previene ataques de downgrade." },
    { name: "Content-Security-Policy", importance: "crítico", desc: "Previene XSS y inyección de contenido." },
    { name: "X-Content-Type-Options", importance: "alto", desc: "Previene MIME-sniffing." },
    { name: "X-Frame-Options", importance: "alto", desc: "Previene clickjacking." },
    { name: "X-XSS-Protection", importance: "medio", desc: "Filtro XSS del navegador (legacy)." },
    { name: "Referrer-Policy", importance: "medio", desc: "Controla información del referrer." },
    { name: "Permissions-Policy", importance: "medio", desc: "Controla APIs del navegador." },
    { name: "Cross-Origin-Opener-Policy", importance: "medio", desc: "Aísla el contexto de navegación." },
    { name: "Cross-Origin-Resource-Policy", importance: "medio", desc: "Protege recursos de carga cross-origin." },
  ];

  const analyze = () => {
    if (!url) return;
    setAnalyzing(true);
    // Simulate analysis since we can't actually fetch headers from client-side
    setTimeout(() => {
      const simulated = securityHeaders.map(h => ({
        ...h,
        present: Math.random() > 0.4,
        value: Math.random() > 0.4 ? `valor-ejemplo-${h.name.toLowerCase().slice(0,8)}` : undefined,
      }));
      setHeaders(simulated);
      setAnalyzing(false);
    }, 1500);
  };

  const score = headers.length > 0 ? Math.round((headers.filter(h => h.present).length / headers.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Referencia de headers de seguridad HTTP esenciales. Comprueba qué headers debería tener tu aplicación web.
      </p>
      <div className="space-y-2">
        {securityHeaders.map(h => (
          <div key={h.name} className="bg-secondary/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono-cyber text-xs font-semibold text-primary">{h.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                h.importance === "crítico" ? "text-destructive bg-destructive/10" :
                h.importance === "alto" ? "text-[hsl(var(--cyber-amber))] bg-[hsl(var(--cyber-amber))]/10" :
                "text-[hsl(45,90%,55%)] bg-[hsl(45,90%,55%)]/10"
              }`}>
                {h.importance}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">{h.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Subnet Calculator ───
function SubnetCalculator() {
  const [ip, setIp] = useState("192.168.1.0");
  const [cidr, setCidr] = useState(24);

  const calculate = () => {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) return null;

    const ipNum = (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
    const mask = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
    const network = (ipNum & mask) >>> 0;
    const broadcast = (network | ~mask) >>> 0;
    const firstHost = cidr >= 31 ? network : (network + 1) >>> 0;
    const lastHost = cidr >= 31 ? broadcast : (broadcast - 1) >>> 0;
    const totalHosts = cidr >= 31 ? (cidr === 32 ? 1 : 2) : Math.pow(2, 32 - cidr) - 2;

    const toIp = (n: number) => `${(n >>> 24) & 255}.${(n >>> 16) & 255}.${(n >>> 8) & 255}.${n & 255}`;

    return {
      network: toIp(network),
      broadcast: toIp(broadcast),
      mask: toIp(mask),
      firstHost: toIp(firstHost),
      lastHost: toIp(lastHost),
      totalHosts,
      cidr,
      classType: parts[0] < 128 ? "A" : parts[0] < 192 ? "B" : parts[0] < 224 ? "C" : "D/E",
      isPrivate: (parts[0] === 10) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168),
    };
  };

  const result = calculate();

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input type="text" value={ip} onChange={e => setIp(e.target.value)}
          placeholder="192.168.1.0"
          className="flex-1 bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none font-mono-cyber" />
        <div className="flex items-center gap-1.5 bg-secondary border border-border rounded-lg px-3">
          <span className="text-sm text-muted-foreground">/</span>
          <input type="number" value={cidr} onChange={e => setCidr(Math.max(0, Math.min(32, Number(e.target.value))))}
            min={0} max={32}
            className="w-10 bg-transparent text-sm text-foreground font-mono-cyber focus:outline-none text-center" />
        </div>
      </div>
      {result && (
        <div className="grid grid-cols-2 gap-2 animate-fade-in">
          {[
            { label: "Red", value: `${result.network}/${result.cidr}` },
            { label: "Broadcast", value: result.broadcast },
            { label: "Máscara", value: result.mask },
            { label: "Primer host", value: result.firstHost },
            { label: "Último host", value: result.lastHost },
            { label: "Hosts totales", value: result.totalHosts.toLocaleString() },
            { label: "Clase", value: `Clase ${result.classType}` },
            { label: "Tipo", value: result.isPrivate ? "Privada" : "Pública" },
          ].map(r => (
            <div key={r.label} className="bg-secondary/30 rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground mb-0.5">{r.label}</p>
              <p className="text-xs font-mono-cyber font-semibold text-foreground">{r.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───
const tools = [
  { id: "password-check", title: "Analizador de Contraseñas", icon: Key, desc: "Evalúa la fortaleza y tiempo de crackeo", component: PasswordChecker },
  { id: "password-gen", title: "Generador de Contraseñas", icon: Shield, desc: "Genera contraseñas seguras y aleatorias", component: PasswordGenerator },
  { id: "hash", title: "Generador de Hashes", icon: Hash, desc: "SHA-1, SHA-256, SHA-384, SHA-512", component: HashGenerator },
  { id: "encoder", title: "Codificador / Decodificador", icon: Lock, desc: "Base64, URL, Hex, Binario", component: EncoderDecoder },
  { id: "subnet", title: "Calculadora de Subredes", icon: Wifi, desc: "CIDR, máscaras, rangos de red", component: SubnetCalculator },
  { id: "ports", title: "Referencia de Puertos", icon: Server, desc: "Puertos comunes y niveles de riesgo", component: PortReference },
  { id: "headers", title: "Headers de Seguridad HTTP", icon: Globe, desc: "Referencia de cabeceras de seguridad", component: HeadersAnalyzer },
];

export default function ToolsPage() {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const active = tools.find(t => t.id === activeTool);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          {activeTool ? (
            <button onClick={() => setActiveTool(null)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm active:scale-95">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Herramientas</span>
            </button>
          ) : (
            <Link to="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm active:scale-95">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Inicio</span>
            </Link>
          )}
          <div className="flex-1 text-center">
            <span className="text-sm font-semibold text-foreground">
              {active ? active.title : "Herramientas de Ciberseguridad"}
            </span>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {!activeTool ? (
          <div className="space-y-6">
            <div className="text-center space-y-2 animate-fade-in">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground" style={{ lineHeight: '1.15' }}>
                Herramientas Interactivas
              </h1>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Utilidades prácticas para tu día a día en ciberseguridad
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool, i) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className="bg-card rounded-xl card-glow p-5 text-left group hover:ring-1 hover:ring-primary/30 transition-all active:scale-[0.98] animate-fade-in-up"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">{tool.title}</h3>
                    <p className="text-xs text-muted-foreground">{tool.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto animate-fade-in">
            {active && <active.component />}
          </div>
        )}
      </main>
    </div>
  );
}
