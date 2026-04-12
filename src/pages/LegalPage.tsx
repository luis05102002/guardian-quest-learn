import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, FileText, Shield, Cookie } from "lucide-react";

type LegalDoc = {
  id: string;
  slug: string;
  title: string;
  content: string;
  version: string;
  updated_at: string;
};

const DOC_ICONS: Record<string, React.ReactNode> = {
  "aviso-legal": <FileText className="w-5 h-5 text-primary" />,
  "privacidad": <Shield className="w-5 h-5 text-primary" />,
  "cookies": <Cookie className="w-5 h-5 text-primary" />,
};

const DOCS_LIST = [
  { slug: "aviso-legal", title: "Aviso Legal", icon: <FileText className="w-5 h-5" /> },
  { slug: "privacidad", title: "Política de Privacidad", icon: <Shield className="w-5 h-5" /> },
  { slug: "cookies", title: "Política de Cookies", icon: <Cookie className="w-5 h-5" /> },
];

export default function LegalPage() {
  const { slug } = useParams<{ slug?: string }>();
  const [docs, setDocs] = useState<LegalDoc[]>([]);
  const [activeDoc, setActiveDoc] = useState<LegalDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDocs() {
      const { data } = await supabase
        .from("legal_documents")
        .select("*")
        .eq("is_active", true)
        .order("title");
      if (data) {
        setDocs(data as LegalDoc[]);
        const targetSlug = slug || data[0]?.slug;
        const found = (data as LegalDoc[]).find(d => d.slug === targetSlug);
        if (found) setActiveDoc(found);
        else if (data.length > 0) setActiveDoc(data[0] as LegalDoc);
      }
      setLoading(false);
    }
    fetchDocs();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm active:scale-95">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Inicio</span>
          </Link>
          <div className="flex-1 text-center">
            <span className="text-sm font-semibold text-foreground">Base Legal</span>
          </div>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Sidebar */}
          <nav className="sm:w-56 shrink-0">
            <div className="space-y-1.5">
              {DOCS_LIST.map(doc => {
                const dbDoc = docs.find(d => d.slug === doc.slug);
                return (
                  <Link
                    key={doc.slug}
                    to={`/legal/${doc.slug}`}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      activeDoc?.slug === doc.slug
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                    }`}
                  >
                    {DOC_ICONS[doc.slug] || <FileText className="w-5 h-5 text-primary" />}
                    <span>{doc.title}</span>
                    {dbDoc && (
                      <span className="ml-auto text-[10px] font-mono-cyber text-muted-foreground">v{dbDoc.version}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {activeDoc ? (
              <div className="bg-card rounded-xl p-6 sm:p-8 card-glow">
                <h1 className="text-xl font-bold text-foreground mb-1">{activeDoc.title}</h1>
                <p className="text-xs text-muted-foreground font-mono-cyber mb-6">
                  Versión {activeDoc.version} · Última actualización: {new Date(activeDoc.updated_at).toLocaleDateString("es-ES")}
                </p>
                <div className="prose prose-sm prose-invert max-w-none text-muted-foreground space-y-4
                  [&_h2]:text-foreground [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-2
                  [&_h3]:text-foreground [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1
                  [&_p]:text-sm [&_p]:leading-relaxed
                  [&_ul]:text-sm [&_ul]:space-y-1 [&_li]:leading-relaxed
                  [&_strong]:text-foreground">
                  <div dangerouslySetInnerHTML={{ __html: activeDoc.content.replace(/\n/g, '<br/>') }} />
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No hay documentos legales disponibles aún.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}