import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

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

    const results = []
    if (scheduledCampaigns && scheduledCampaigns.length > 0) {
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
    }

    // 3. Update status of any completed campaigns
    const { error: updateError } = await supabaseClient.rpc('update_completed_campaigns');
    if (updateError) {
        console.error('Error updating completed campaigns:', updateError.message);
        // This is not a critical error, so we don't throw, just log it.
    }


    return new Response(JSON.stringify({ message: 'Campaign dispatcher finished.', results }), {
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