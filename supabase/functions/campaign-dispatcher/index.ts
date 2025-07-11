import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Find campaigns that are 'scheduled' and ready to be processed
    const { data: scheduledCampaigns, error } = await supabaseClient
      .from('campaigns')
      .select('id')
      .eq('status', 'scheduled')
      .lte('scheduled_for', new Date().toISOString())

    if (error) {
      throw new Error(`Error fetching scheduled campaigns: ${error.message}`)
    }

    if (!scheduledCampaigns || scheduledCampaigns.length === 0) {
      return new Response(JSON.stringify({ message: 'No campaigns to prepare right now.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const results = []
    // 2. For each campaign, call the RPC function to queue it atomically
    for (const campaign of scheduledCampaigns) {
      const { data, error: rpcError } = await supabaseClient.rpc('queue_and_activate_campaign', {
        campaign_id_param: campaign.id,
      })

      if (rpcError) {
        console.error(`Error processing campaign ${campaign.id}:`, rpcError.message)
        // If the RPC fails, mark the campaign as 'failed' to prevent retries
        await supabaseClient.from('campaigns').update({ status: 'failed' }).eq('id', campaign.id)
        results.push({ success: false, campaignId: campaign.id, error: rpcError.message })
      } else {
        results.push({ success: true, campaignId: campaign.id, result: data })
      }
    }

    return new Response(JSON.stringify({ message: 'Campaign preparation finished.', results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Critical error in campaign-dispatcher:', error)
    return new Response(JSON.stringify({ error: error.message, success: false }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})