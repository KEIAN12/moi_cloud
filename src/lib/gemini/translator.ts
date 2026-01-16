import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY || ''
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

export interface GlossaryTerm {
  ja_term: string
  fr_term: string
}

/**
 * Get glossary terms for translation context
 */
async function getGlossaryTerms(): Promise<GlossaryTerm[]> {
  try {
    // Try to fetch from Supabase
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { supabase } = await import('../supabase/client')
      const { data, error } = await supabase
        .from('glossary_terms')
        .select('ja_term, fr_term')
        .order('ja_term', { ascending: true })

      if (!error && data && data.length > 0) {
        return data.map(term => ({
          ja_term: term.ja_term,
          fr_term: term.fr_term,
        }))
      }
    }
  } catch (error) {
    console.error('Error fetching glossary from Supabase:', error)
  }

  // Fallback to default terms
  return [
    { ja_term: '仕込み', fr_term: 'Préparation' },
    { ja_term: '焼き', fr_term: 'Cuisson' },
    { ja_term: '発注', fr_term: 'Commande' },
    { ja_term: '買い込み', fr_term: 'Achat' },
    { ja_term: '取り置き', fr_term: 'Réservation' },
    { ja_term: 'レジ締め', fr_term: 'Fermeture de caisse' },
    { ja_term: '開店準備', fr_term: 'Préparation ouverture' },
    { ja_term: '締め', fr_term: 'Fermeture' },
    { ja_term: '受付完了', fr_term: 'Réservation confirmée' },
    { ja_term: '受付終了', fr_term: 'Réservation fermée' },
  ]
}

/**
 * Translate Japanese to French using Gemini API
 */
export async function translateJaToFr(text: string): Promise<string> {
  if (!genAI) {
    console.warn('Gemini API key not configured. Returning original text.')
    return text
  }

  if (!text || text.trim().length === 0) {
    return ''
  }

  try {
    const glossary = await getGlossaryTerms()
    const glossaryText = glossary
      .map((term) => `- ${term.ja_term} → ${term.fr_term}`)
      .join('\n')

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

    const prompt = `あなたは日本語からフランス語への翻訳専門家です。以下の用語集を必ず使用してください。

用語集:
${glossaryText}

以下の日本語をフランス語に翻訳してください。用語集にある用語は必ず指定されたフランス語を使用してください。簡潔で自然なフランス語に翻訳してください。

日本語:
${text}

フランス語:`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const translated = response.text().trim()

    return translated
  } catch (error) {
    console.error('Translation error (JA→FR):', error)
    throw error
  }
}

/**
 * Translate French to Japanese using Gemini API
 */
export async function translateFrToJa(text: string): Promise<string> {
  if (!genAI) {
    console.warn('Gemini API key not configured. Returning original text.')
    return text
  }

  if (!text || text.trim().length === 0) {
    return ''
  }

  try {
    const glossary = await getGlossaryTerms()
    const glossaryText = glossary
      .map((term) => `- ${term.fr_term} → ${term.ja_term}`)
      .join('\n')

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

    const prompt = `Vous êtes un expert en traduction du français vers le japonais. Utilisez obligatoirement le glossaire suivant.

Glossaire:
${glossaryText}

Traduisez le français suivant en japonais. Utilisez obligatoirement les termes japonais spécifiés dans le glossaire pour les termes correspondants. Traduisez en japonais naturel et concis.

Français:
${text}

Japonais:`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const translated = response.text().trim()

    return translated
  } catch (error) {
    console.error('Translation error (FR→JA):', error)
    throw error
  }
}
