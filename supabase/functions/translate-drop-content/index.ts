import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranslateRequest {
  text: string;
  field: 'title' | 'description' | 'story' | 'details';
  sourceLanguage?: 'en' | 'nl';
  generateBoth?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, field, sourceLanguage, generateBoth = true } = await req.json() as TranslateRequest;
    
    if (!text || !field) {
      return new Response(
        JSON.stringify({ error: 'Text and field are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const fieldDescriptions: Record<string, string> = {
      title: 'product title (short, catchy, max 60 characters)',
      description: 'product description (compelling, max 200 characters)',
      story: 'product story/background (narrative, evocative, 150-300 words)',
      details: 'product details/specifications (informative, bullet-point style works)',
    };

    const systemPrompt = `You are a luxury goods copywriter for an exclusive wine and rare goods club called "The Rare Goods Club". 
Your writing style is:
- Sophisticated but approachable
- Evocative and sensory
- Exclusive without being pretentious
- Warm and inviting

You translate and adapt content between English and Dutch, ensuring the tone and quality matches in both languages.
Important: Keep the translations natural, not literal. Adapt idioms and expressions appropriately.

Field you're working on: ${fieldDescriptions[field] || field}`;

    let userPrompt = '';
    
    if (generateBoth) {
      userPrompt = `Based on this input text, generate compelling content for both English and Dutch versions.

Input text: "${text}"

Generate natural, high-quality content for the "${field}" field in both languages. 
The content should feel native in each language, not like a direct translation.

Respond in JSON format only:
{
  "${field}_en": "English version here",
  "${field}_nl": "Dutch version here"
}`;
    } else {
      const targetLang = sourceLanguage === 'en' ? 'nl' : 'en';
      const targetLangName = targetLang === 'en' ? 'English' : 'Dutch';
      
      userPrompt = `Translate and adapt this ${sourceLanguage === 'en' ? 'English' : 'Dutch'} text to ${targetLangName}.

Source text: "${text}"

This is for the "${field}" field. Make sure the translation feels natural in ${targetLangName}, not like a literal translation.

Respond in JSON format only:
{
  "${field}_${targetLang}": "Translated version here"
}`;
    }

    console.log('Calling Lovable AI for translation...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from AI');
    }

    console.log('AI response:', content);

    // Parse the JSON response from AI
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response as JSON');
    }

    const result = JSON.parse(jsonMatch[0]);
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Translation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Translation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
