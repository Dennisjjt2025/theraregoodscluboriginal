import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRequest {
  description: string;
  origin?: string;
  vintage?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, origin, vintage } = await req.json() as GenerateRequest;
    
    if (!description) {
      return new Response(
        JSON.stringify({ error: 'Description is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a luxury goods copywriter for "The Rare Goods Club", an exclusive members-only club for rare wines and luxury goods.

Your writing style is:
- Sophisticated but approachable
- Evocative and sensory  
- Exclusive without being pretentious
- Warm and inviting

You create compelling product content in both English and Dutch that:
- Tells a story about the product's heritage and craftsmanship
- Appeals to discerning collectors
- Creates desire while remaining authentic
- Uses rich, sensory language

IMPORTANT: Dutch content should feel native, not translated. Use natural Dutch expressions and phrasing.`;

    const contextInfo = [
      origin ? `Origin: ${origin}` : '',
      vintage ? `Vintage/Year: ${vintage}` : '',
    ].filter(Boolean).join('\n');

    const userPrompt = `Based on this description, generate complete product content for a luxury goods drop:

Description: "${description}"
${contextInfo ? `\n${contextInfo}` : ''}

Generate compelling content for all fields in both English and Dutch.

Respond with ONLY valid JSON in this exact format:
{
  "title_en": "Short catchy title (max 50 chars)",
  "title_nl": "Korte pakkende titel (max 50 tekens)",
  "description_en": "Brief compelling description (max 150 chars)",
  "description_nl": "Korte overtuigende beschrijving (max 150 tekens)",
  "story_en": "The rich story behind this product (150-250 words). Tell the heritage, the maker, the craftsmanship, the terroir if wine.",
  "story_nl": "Het rijke verhaal achter dit product (150-250 woorden). Vertel over de erfenis, de maker, het vakmanschap, het terroir bij wijn.",
  "details_en": "Product details and specifications. For wine: tasting notes, pairing suggestions. For other goods: materials, dimensions, care.",
  "details_nl": "Productdetails en specificaties. Voor wijn: proefnotities, suggesties voor combinaties. Voor andere producten: materialen, afmetingen, verzorging."
}`;

    console.log('Calling Lovable AI for content generation...');
    
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
        temperature: 0.8,
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
    console.error('Content generation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Content generation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
