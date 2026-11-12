/**
 * Motor de Auto-Categorización Inteligente para HogarIQ
 * Asocia automáticamente descripciones y comercios con las categorías del hogar
 */

export interface KeywordRule {
  keywords: string[];
  categoryPatterns: string[]; // Nombres o patrones probables de la categoría
}

export const CATEGORY_RULES: KeywordRule[] = [
  {
    keywords: [
      'supermercado', 'super', 'despensa', 'mercado', 'costco', 'walmart', 'mercadona', 
      'carrefour', 'jumbo', 'lider', 'exito', 'almuerzo', 'cena', 'desayuno', 'comida', 
      'restaurante', 'mcdonalds', 'burger', 'pizza', 'sushi', 'starbucks', 'cafe', 
      'uber eats', 'rappi', 'pedidosya', 'didi food', 'panaderia', 'carniceria', 'fruteria'
    ],
    categoryPatterns: ['alimentacion', 'comida', 'supermercado', 'restaurante', 'alimentos', 'groceries']
  },
  {
    keywords: [
      'uber', 'didi', 'cabify', 'taxi', 'gasolina', 'combustible', 'nafta', 'gasoil', 
      'shell', 'texaco', 'chevron', 'ypf', 'estacionamiento', 'parqueo', 'peaje', 
      'metro', 'autobus', 'tren', 'sube', 'taller', 'mecanico', 'lavado auto', 'seguro auto'
    ],
    categoryPatterns: ['transporte', 'gasolina', 'combustible', 'vehiculo', 'auto', 'transport']
  },
  {
    keywords: [
      'luz', 'electricidad', 'cfe', 'enel', 'edenor', 'edesur', 'agua', 'aysa', 
      'gas natural', 'internet', 'wifi', 'fibra', 'telefono', 'celular', 'claro', 
      'movistar', 'tigo', 'personal', 'alquiler', 'renta', 'condominio', 'expensas', 'mantenimiento'
    ],
    categoryPatterns: ['servicios', 'hogar', 'vivienda', 'servicios basicos', 'utilities', 'bills']
  },
  {
    keywords: [
      'netflix', 'spotify', 'hbo', 'disney', 'prime video', 'apple', 'youtube', 
      'cine', 'cinepolis', 'cinemark', 'teatro', 'concierto', 'videojuego', 'steam', 
      'playstation', 'xbox', 'nintendo', 'gimnasio', 'gym', 'smart fit', 'bar', 'cerveza', 'salida'
    ],
    categoryPatterns: ['entretenimiento', 'ocio', 'suscripciones', 'diversion', 'entertainment']
  },
  {
    keywords: [
      'farmacia', 'medicamento', 'medicina', 'doctor', 'consulta medica', 'dentista', 
      'odontologo', 'optica', 'lentes', 'laboratorio', 'analisis', 'hospital', 
      'clinica', 'seguro medico', 'eps', 'sanatorio'
    ],
    categoryPatterns: ['salud', 'farmacia', 'medicina', 'bienestar', 'health']
  },
  {
    keywords: [
      'colegio', 'escuela', 'universidad', 'matricula', 'pension escolar', 'cuota escolar', 
      'curso', 'udemy', 'coursera', 'platzi', 'libros', 'utiles', 'papeleria', 'uniforme'
    ],
    categoryPatterns: ['educacion', 'colegio', 'estudios', 'education']
  },
  {
    keywords: [
      'ropa', 'zapatos', 'tienda', 'zara', 'h&m', 'shein', 'amazon', 'aliexpress', 
      'mercadolibre', 'falabella', 'liverpool', 'regalo', 'cumpleanos', 'peluqueria', 
      'barberia', 'cosmeticos', 'perfume'
    ],
    categoryPatterns: ['compras', 'ropa', 'personal', 'cuidado personal', 'shopping']
  },
  {
    keywords: [
      'ahorro', 'inversion', 'cetes', 'plazo fijo', 'fondo', 'meta', 'cripto', 
      'bitcoin', 'bolsa', 'acciones'
    ],
    categoryPatterns: ['ahorro', 'inversion', 'metas', 'savings']
  }
];

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Encuentra automáticamente la categoría más idónea para una descripción dada
 */
export function suggestCategory(description: string, categories: any[]): any | null {
  if (!description || !categories || categories.length === 0) return null;

  const normalizedDesc = normalizeText(description);

  // 1. Coincidencia directa por regla de palabras clave
  for (const rule of CATEGORY_RULES) {
    const hasKeyword = rule.keywords.some((kw) => {
      const normalizedKw = normalizeText(kw);
      return normalizedDesc.includes(normalizedKw);
    });

    if (hasKeyword) {
      // Buscar entre las categorías del usuario la que coincida con los patrones de esta regla
      const matchedCategory = categories.find((cat) => {
        const normalizedCatName = normalizeText(cat.name);
        return rule.categoryPatterns.some((pattern) => normalizedCatName.includes(pattern));
      });

      if (matchedCategory) return matchedCategory;
    }
  }

  // 2. Coincidencia por similitud directa de nombre de categoría en la descripción
  const directMatch = categories.find((cat) => {
    const normalizedCatName = normalizeText(cat.name);
    return normalizedCatName.length > 3 && normalizedDesc.includes(normalizedCatName);
  });

  if (directMatch) return directMatch;

  return null;
}
