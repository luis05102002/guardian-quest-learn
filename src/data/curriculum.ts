export interface Lesson {
  id: string;
  title: string;
  type: 'lesson' | 'demo' | 'case' | 'evaluation' | 'feedback';
}

export interface Section {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Module {
  id: number;
  title: string;
  shortTitle: string;
  icon: string;
  sections: Section[];
  gradientClass: string;
}

function lesson(title: string, type: Lesson['type'] = 'lesson'): Lesson {
  return { id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'), title, type };
}

export const curriculum: Module[] = [
  {
    id: 1,
    title: "Presentación y Conceptos de Ciberseguridad",
    shortTitle: "Conceptos",
    icon: "Shield",
    gradientClass: "module-gradient-1",
    sections: [
      {
        id: "1-1",
        title: "Bienvenida",
        lessons: [
          lesson("Presentación del programa"),
          lesson("Estructura y Metodología"),
          lesson("Plataforma"),
          lesson("Comunidad"),
        ]
      },
      {
        id: "1-2",
        title: "Conceptos de Ciberseguridad",
        lessons: [
          lesson("Diccionario de términos - Glosario"),
          lesson("¿Qué es y cómo funciona internet?"),
          lesson("Servidores y páginas web"),
          lesson("¿Qué es la Ciberseguridad? (Ciberseguridad vs Seguridad de la Información)"),
          lesson("Dimensiones de la Ciberseguridad"),
          lesson("Principios de la Ciberseguridad"),
          lesson("Conceptos clave en ciberseguridad"),
          lesson("Roles y Perfiles en Ciberseguridad"),
          lesson("Organigrama en Ciberseguridad"),
          lesson("Otros roles relevantes de la Organización (CIO, COO, CDO, etc.)"),
          lesson("Ecosistema de Certificaciones"),
          lesson("Evaluación: Conceptos de Ciberseguridad", "evaluation"),
          lesson("Queremos saber tu opinión", "feedback"),
        ]
      }
    ]
  },
  {
    id: 2,
    title: "Amenazas y vectores de ataque",
    shortTitle: "Amenazas",
    icon: "Zap",
    gradientClass: "module-gradient-2",
    sections: [
      {
        id: "2-1",
        title: "Amenazas de la Ciberseguridad",
        lessons: [
          lesson("Tipos de Amenazas"),
          lesson("Filtración de información"),
          lesson("Denegación de Servicio (DoS y DDoS)"),
          lesson("¿Qué es un Ataque Dirigido o APT?"),
          lesson("Ransomware"),
          lesson("Hacktivismo y Ciberterrorismo"),
          lesson("Evaluación: Amenazas de Ciberseguridad", "evaluation"),
        ]
      },
      {
        id: "2-2",
        title: "Vectores de Ataque",
        lessons: [
          lesson("Phishing vs Smishing vs Vishing"),
          lesson("Malware vs Virus"),
          lesson("Robo de credenciales"),
          lesson("Multifactor de autenticación"),
          lesson("Man-in-the-middle"),
          lesson("Exploits"),
          lesson("Contraseñas débiles"),
          lesson("Casos sonados de Ciberataques"),
          lesson("Evaluación: Vectores de Ataque", "evaluation"),
          lesson("Queremos saber tu opinión", "feedback"),
        ]
      }
    ]
  },
  {
    id: 3,
    title: "Introducción a marcos normativos",
    shortTitle: "Marcos",
    icon: "BookOpen",
    gradientClass: "module-gradient-3",
    sections: [
      {
        id: "3-1",
        title: "Introducción a los Marcos de Ciberseguridad",
        lessons: [
          lesson("Introducción a los Marcos de Ciberseguridad"),
          lesson("Introducción a Estándar ISO 27001"),
          lesson("Introducción a Norma ENS"),
          lesson("Introducción a NIST Cybersecurity Framework"),
          lesson("Introducción al CIS"),
          lesson("Modelo de madurez: CMMI"),
          lesson("Otros marcos de referencia"),
          lesson("Evaluación: Marcos de Ciberseguridad", "evaluation"),
        ]
      }
    ]
  },
  {
    id: 4,
    title: "GRC: Gestión del Riesgo I",
    shortTitle: "Riesgos I",
    icon: "BarChart3",
    gradientClass: "module-gradient-4",
    sections: [
      {
        id: "4-1",
        title: "Gestión del Riesgo",
        lessons: [
          lesson("¿Qué son Activos?"),
          lesson("¿Qué es el Riesgo?"),
          lesson("Fases del Análisis y Gestión de Riesgos"),
          lesson("Probabilidad vs Impacto"),
          lesson("Inventariado y Mapeo de Activos"),
          lesson("Matriz de Riesgos"),
          lesson("Evaluación de Riesgos"),
          lesson("Controles de Seguridad"),
          lesson("Metodologías de Análisis de Riesgos"),
          lesson("Análisis de Riesgos: Magerit"),
          lesson("Plan del Tratamiento del Riesgo (PTR)"),
          lesson("Caso: Inventario de Activos", "case"),
          lesson("Caso: Identificación de Amenazas", "case"),
          lesson("Caso: Evaluación de Controles", "case"),
          lesson("Caso: Evaluación de Riesgos", "case"),
          lesson("Caso: Plan del Tratamiento del Riesgo", "case"),
        ]
      }
    ]
  },
  {
    id: 5,
    title: "GRC: Gestión del Riesgo II",
    shortTitle: "Riesgos II",
    icon: "Scale",
    gradientClass: "module-gradient-5",
    sections: [
      {
        id: "5-1",
        title: "Cumplimiento normativo",
        lessons: [
          lesson("ISO 27001 vs ISO 27002"),
          lesson("Fundamentos ISO 27001"),
          lesson("Fundamentos ISO 27002"),
          lesson("ISO 27002 - Controles Organizacionales"),
          lesson("ISO 27002 - Controles Tecnológicos"),
          lesson("Fundamentos ENS"),
          lesson("ENS - Principios básicos y Requisitos mínimos"),
          lesson("ENS - Categorización de los sistemas de información"),
          lesson("ENS - Marco organizativo, operacional y medidas de protección"),
          lesson("ENS - Guías STIC e ITS"),
          lesson("Ejemplo práctico de recursos del ENS - Parte 1", "case"),
          lesson("Ejemplo práctico de recursos del ENS - Parte 2", "case"),
          lesson("ENS - Roles: Ejemplo basado en recursos del ENS", "case"),
          lesson("Contexto de organismos normativos e introducción a NIST"),
          lesson("Fundamentos NIST Cybersecurity Framework (CSF)"),
          lesson("NIST Marco básico"),
          lesson("NIST Niveles de implementación y perfiles"),
          lesson("Conclusiones ¿Qué es mejor y qué elegimos?"),
          lesson("Caso: Construye tu propio SGSI conforme a la ISO 27001", "case"),
        ]
      }
    ]
  },
  {
    id: 6,
    title: "Infraestructuras de TI",
    shortTitle: "Infra TI",
    icon: "Server",
    gradientClass: "module-gradient-6",
    sections: [
      {
        id: "6-1",
        title: "Introducción a infraestructuras de TI",
        lessons: [
          lesson("Elementos clave y cómo se relacionan"),
          lesson("Modelo de capas"),
          lesson("Tipos de activos de TI"),
          lesson("Tipos de Entornos: On-premises"),
          lesson("Tipos de Entornos: Cloud"),
          lesson("Tipos de Entorno: Ventajas vs Inconvenientes"),
          lesson("Virtualización de entornos"),
          lesson("Segmentación de redes"),
          lesson("Modelo Cliente-Servidor"),
          lesson("Alta disponibilidad vs Contingencia"),
          lesson("Tecnologías y lenguajes básicos en ciberseguridad"),
        ]
      }
    ]
  },
  {
    id: 7,
    title: "Protocolos de red, SO y Bash",
    shortTitle: "Redes & Linux",
    icon: "Terminal",
    gradientClass: "module-gradient-1",
    sections: [
      {
        id: "7-1",
        title: "Protocolos de red",
        lessons: [
          lesson("IP"),
          lesson("DNS"),
          lesson("TCP y UDP"),
          lesson("Ejemplos de ataques basados en protocolos de red (SYN FLOOD, FRAGGLE)"),
        ]
      },
      {
        id: "7-2",
        title: "Introducción a UNIX/Linux",
        lessons: [
          lesson("Fundamentos de Linux"),
          lesson("Comandos básicos 1"),
          lesson("Comandos básicos 2"),
          lesson("Automatización de tareas y conexión"),
          lesson("History, comando passwd y shadow"),
        ]
      },
      {
        id: "7-3",
        title: "Terminal y Bash",
        lessons: [
          lesson("Fundamentos de la terminal"),
          lesson("Comandos básicos y operaciones de directorio"),
          lesson("Comandos de operaciones con ficheros"),
          lesson("Búsqueda de ficheros, gestión de procesos y creación de alias"),
          lesson("Cambiar aspecto de la terminal"),
          lesson("Queremos saber tu opinión", "feedback"),
        ]
      }
    ]
  },
  {
    id: 8,
    title: "Diapositivas",
    shortTitle: "Slides",
    icon: "Presentation",
    gradientClass: "module-gradient-2",
    sections: [
      {
        id: "8-1",
        title: "Diapositivas",
        lessons: [
          lesson("Primeros pasos en Hacking Ético: Introducción al Pentesting y Análisis de Vulnerabilidades"),
          lesson("Domina el Pentesting Interno: Fundamentos de Intrusión en Redes Corporativas"),
          lesson("Pentesting Externo: Cómo Romper Perímetros y Evaluar la Seguridad"),
          lesson("Del Ataque a la Defensa: Fortificación y Análisis de Incidentes en Ciberseguridad"),
        ]
      }
    ]
  },
  {
    id: 9,
    title: "Seguridad ofensiva",
    shortTitle: "Red Team",
    icon: "Crosshair",
    gradientClass: "module-gradient-2",
    sections: [
      {
        id: "9-1",
        title: "Seguridad Ofensiva (Hacking Ético): Red teaming",
        lessons: [
          lesson("Análisis de Vulnerabilidades"),
          lesson("Auditorías de Seguridad"),
          lesson("Tipos de Auditoria: Caja Negra, Gris, Blanca"),
          lesson("Pentest: Test de Intrusión"),
          lesson("Introducción a OSTMM"),
          lesson("¿Qué es OSINT?"),
          lesson("Reconocimiento"),
          lesson("Demo: Reconocimiento - DNSdumpster", "demo"),
          lesson("Demo: Reconocimiento - NMAP", "demo"),
          lesson("Demo: Reconocimiento - Robots", "demo"),
          lesson("Demo: Reconocimiento - SpiderFoot", "demo"),
          lesson("Demo: Reconocimiento - The Harvester", "demo"),
          lesson("Demo: Reconocimiento - Sherlock", "demo"),
          lesson("Demo: Reconocimiento - CrossLinked", "demo"),
          lesson("Ejemplo de Recon con Python", "demo"),
          lesson("Queremos saber tu opinión", "feedback"),
          lesson("Obtención de Acceso inicial"),
          lesson("Demo: Obtención de Acceso inicial en una máquina Linux y explotación", "demo"),
          lesson("Obtención de Persistencia"),
          lesson("Movimiento lateral"),
          lesson("Exfiltración de información"),
          lesson("Cobertura de huellas (Covering tracks)"),
        ]
      }
    ]
  },
  {
    id: 10,
    title: "Desarrollo seguro",
    shortTitle: "DevSec",
    icon: "Code",
    gradientClass: "module-gradient-3",
    sections: [
      {
        id: "10-1",
        title: "Riesgos y vulnerabilidades de las aplicaciones",
        lessons: [
          lesson("Metodologías de Desarrollo (Clásicas vs Agile)"),
          lesson("Metodologías de clasificación de vulnerabilidades"),
          lesson("Demo: CVSS", "demo"),
          lesson("Marcos de seguridad y referencia"),
          lesson("Top 10 de OWASP"),
          lesson("Demo: Top 10 OWASP", "demo"),
        ]
      },
      {
        id: "10-2",
        title: "Modelos y frameworks",
        lessons: [
          lesson("Qué es desarrollo seguro y principios de diseño"),
          lesson("Principales modelos de desarrollo seguro"),
          lesson("Demo: SAMM", "demo"),
        ]
      },
      {
        id: "10-3",
        title: "Integración de actividades en el ciclo de desarrollo",
        lessons: [
          lesson("Modelado de amenazas y figura de Security Champion"),
          lesson("Metodologías y herramientas de modelado de amenazas"),
          lesson("Caso de abuso y mal uso", "case"),
          lesson("Demo: Caso de abuso", "demo"),
          lesson("Demo: Threat Modeling", "demo"),
          lesson("Testing de software: Tipos de pruebas"),
          lesson("DevSecOps y DSOMM"),
          lesson("Controles de seguridad durante el desarrollo"),
          lesson("Demo: DevSecOps", "demo"),
        ]
      },
      {
        id: "10-4",
        title: "Monitorización y protección de aplicaciones en producción",
        lessons: [
          lesson("Demo: Pentesting", "demo"),
        ]
      }
    ]
  },
  {
    id: 11,
    title: "Protección frente a Ciberamenazas",
    shortTitle: "Blue Team",
    icon: "ShieldCheck",
    gradientClass: "module-gradient-1",
    sections: [
      {
        id: "11-1",
        title: "Operaciones de Seguridad",
        lessons: [
          lesson("Modelo de Delivery clásico"),
          lesson("Modelo de DevSecOps"),
          lesson("Gestión de Vulnerabilidades"),
          lesson("Estándar CVSS + Caso ejemplo"),
          lesson("Control de Accesos / Gestión de Usuarios"),
          lesson("Gestión de Activos: Inventario/CMDB"),
          lesson("Gestión de Activos: Ciclo de vida"),
          lesson("Gestión de Activos y Controles criptográficos"),
        ]
      },
      {
        id: "11-2",
        title: "Medidas de Protección",
        lessons: [
          lesson("Seguridad de las Identidades"),
          lesson("Seguridad del End-point"),
          lesson("Seguridad en Red"),
          lesson("Seguridad en Web"),
          lesson("Seguridad en Cloud"),
          lesson("CSPM/CWP/CASB y otros medios"),
          lesson("Seguridad en On-premises"),
          lesson("Seguridad en los Datos"),
          lesson("Arquitecturas de seguridad"),
          lesson("Modelo Zero-Trust"),
          lesson("Modelo SASE"),
          lesson("Caso: Diseñemos la seguridad de un entorno desde cero", "case"),
        ]
      },
      {
        id: "11-3",
        title: "Concienciación y Formación",
        lessons: [
          lesson("Concienciación y Formación: Objetivos e importancia"),
          lesson("Planes de formación"),
          lesson("Caso: Planes de Formación", "case"),
          lesson("Caso: Taller Gophish", "case"),
        ]
      },
      {
        id: "11-4",
        title: "Ciberinteligencia",
        lessons: [
          lesson("Ciberinteligencia: conceptos"),
          lesson("El ciclo de la ciberinteligencia"),
          lesson("Tipos de ciberinteligencia"),
          lesson("Queremos saber tu opinión", "feedback"),
        ]
      }
    ]
  },
  {
    id: 12,
    title: "Detección, Respuesta y Recuperación ante un Incidente",
    shortTitle: "Incidentes",
    icon: "AlertTriangle",
    gradientClass: "module-gradient-4",
    sections: [
      {
        id: "12-1",
        title: "Detección de eventos de ciberseguridad",
        lessons: [
          lesson("SOC vs CERT vs CSIRT"),
          lesson("Eventos vs Alertas vs Incidentes de seguridad"),
          lesson("Procedimiento de triage y escalado"),
          lesson("¿Qué es un SIEM? Capacidades y arquitecturas"),
          lesson("¿Qué es Threat Hunting? Herramientas y métodos"),
          lesson("Playbooks de detección y escalado de alertas"),
          lesson("TTPs, Frameworks de detect and respond, MITRE ATT&CK"),
          lesson("Caso: Construye un caso de uso SIEM", "case"),
          lesson("Caso: Construye tu propio Playbook de Detección", "case"),
          lesson("Herramientas para la gestión de Incidentes y documentación"),
          lesson("Caso: Orquesta enriquecimiento y triage de un incidente", "case"),
          lesson("Normativa aplicable Detección y Respuesta"),
        ]
      },
      {
        id: "12-2",
        title: "Respuesta ante incidentes de ciberseguridad",
        lessons: [
          lesson("Plan de Respuesta ante Incidentes (PRI)"),
          lesson("Ciclo de vida del incidente de seguridad"),
          lesson("Fase de Identificación y contenciones, Fase de erradicación"),
          lesson("Playbooks de respuesta a incidentes"),
          lesson("Registro de evidencias e informe del incidente"),
          lesson("Caso: Playbooks de respuesta a incidentes", "case"),
          lesson("Caso: Recuperación y Post Incidente - Ransomware", "case"),
          lesson("Comité de seguridad y plan de respuesta crítico"),
        ]
      },
      {
        id: "12-3",
        title: "Recuperación ante incidentes de ciberseguridad",
        lessons: [
          lesson("Conceptos básicos continuidad de negocio"),
          lesson("Plan de continuidad"),
          lesson("Plan de continuidad: BIA, RTO y RPO"),
          lesson("Plan de continuidad: AARR"),
          lesson("Plan de continuidad: Escenarios y Estrategias de contingencia"),
          lesson("Plan de continuidad: Plan de actuación"),
          lesson("Plan de continuidad: Pruebas de planes de recuperación"),
          lesson("Plan de continuidad: Mantenimiento y Formación"),
          lesson("Plan de continuidad: Plan de contingencia tecnológica"),
          lesson("Plan de continuidad: Plan de recuperación de desastres"),
          lesson("Plan de continuidad: Estándar ISO 22301"),
          lesson("Caso: Crea tu propio PCN", "case"),
          lesson("Gestión de crisis: Conceptos"),
          lesson("Modelado de la gestión de crisis: Identificación y categorización"),
          lesson("Modelado de la gestión de crisis: Análisis y escalado"),
          lesson("Modelado de la gestión de crisis: Plan de comunicación"),
          lesson("Modelado de la gestión de crisis: Simulación"),
          lesson("Caso: Simulacro de un incidente de Seguridad", "case"),
        ]
      },
      {
        id: "12-4",
        title: "Acciones Post-incidente",
        lessons: [
          lesson("Nociones de Forense en sistemas y redes"),
          lesson("Análisis Forense (Informe Post-mortem)"),
        ]
      }
    ]
  },
  {
    id: 13,
    title: "Gobierno y Privacidad del dato",
    shortTitle: "Gobierno",
    icon: "Building2",
    gradientClass: "module-gradient-5",
    sections: [
      {
        id: "13-1",
        title: "Gobierno de Ciberseguridad",
        lessons: [
          lesson("El Rol del CISO"),
          lesson("Estructura de un Departamento de Seguridad de la Información"),
          lesson("Comités de Seguridad"),
          lesson("Líneas de Defensa"),
          lesson("Visión y Estrategia de Ciberseguridad"),
          lesson("Políticas y Procedimientos"),
          lesson("Caso: Política de Seguridad de la Información", "case"),
          lesson("Objetivos y Métricas"),
          lesson("KPI's vs KRI's"),
          lesson("Clasificación de la Información"),
          lesson("Criticidad de la Información"),
          lesson("Gestión de Riesgos de Terceros - TPRM"),
          lesson("Caso: Evaluación de Riesgos de Terceros", "case"),
          lesson("¿Qué es un Plan Director de Seguridad - PDS?"),
          lesson("Caso: Construcción de un PDS", "case"),
          lesson("Queremos saber tu opinión", "feedback"),
        ]
      }
    ]
  },
];

export function getTotalLessons(module: Module): number {
  return module.sections.reduce((acc, s) => acc + s.lessons.length, 0);
}

export function getAllLessonsCount(): number {
  return curriculum.reduce((acc, m) => acc + getTotalLessons(m), 0);
}
