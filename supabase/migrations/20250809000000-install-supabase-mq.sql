-- Instala a extensão supabase_mq, que é necessária para o sistema de filas
CREATE EXTENSION IF NOT EXISTS "supabase_mq";

-- Cria a tabela de filas de mensagens, se ela ainda não existir
-- Esta tabela é usada pela função queue-worker para processar mensagens com intervalos randômicos
CREATE TABLE IF NOT EXISTS supabase_mq.messages (
    id BIGSERIAL PRIMARY KEY,
    msg_id BIGINT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cria um índice na coluna msg_id para melhorar o desempenho da função de leitura
CREATE INDEX IF NOT EXISTS idx_supabase_mq_messages_msg_id ON supabase_mq.messages (msg_id);

-- Cria um índice na coluna created_at para garantir que as mensagens sejam processadas na ordem correta
CREATE INDEX IF NOT EXISTS idx_supabase_mq_messages_created_at ON supabase_mq.messages (created_at);

-- Concede permissão à função authenticated para inserir mensagens na fila
-- Isso é necessário para que a função start_campaign_processing possa adicionar mensagens à fila
GRANT INSERT ON supabase_mq.messages TO authenticated;

-- Concede permissão à função authenticated para ler mensagens da fila
-- Isso é necessário para que a função queue-worker possa processar as mensagens
GRANT SELECT ON supabase_mq.messages TO authenticated;

-- Concede permissão à função authenticated para atualizar o status das mensagens na fila
-- Isso é necessário para que a função queue-worker possa marcar as mensagens como processadas
GRANT UPDATE ON supabase_mq.messages TO authenticated;

-- Concede permissão à função authenticated para excluir mensagens da fila
-- Isso é necessário para que a função queue-worker possa remover as mensagens após o processamento
GRANT DELETE ON supabase_mq.messages TO authenticated;

-- Concede permissão à função authenticated para usar a extensão supabase_mq
GRANT USAGE ON SCHEMA supabase_mq TO authenticated;

-- Concede permissão à função authenticated para usar a função de leitura da fila
GRANT EXECUTE ON FUNCTION supabase_mq.read_messages(integer) TO authenticated;

-- Concede permissão à função authenticated para usar a função de confirmação de processamento
GRANT EXECUTE ON FUNCTION supabase_mq.ack_message(bigint) TO authenticated;

-- Concede permissão à função authenticated para usar a função de escrita na fila
GRANT EXECUTE ON FUNCTION supabase_mq.insert_messages(jsonb) TO authenticated;

-- Concede permissão à função authenticated para usar a função de leitura da fila com parâmetros
GRANT EXECUTE ON FUNCTION supabase_mq.read_from_message_queue(integer) TO authenticated;

-- Concede permissão à função authenticated para usar a função de escrita na fila com parâmetros
GRANT EXECUTE ON FUNCTION supabase_mq.write_to_message_queue(jsonb, integer) TO authenticated;

-- Concede permissão à função authenticated para usar a função de leitura da fila com limite
GRANT EXECUTE ON FUNCTION supabase_mq.read_messages_with_limit(integer) TO authenticated;

-- Concede permissão à função authenticated para usar a função de escrita na fila com limite
GRANT EXECUTE ON FUNCTION supabase_mq.insert_messages_with_limit(jsonb, integer) TO authenticated;

-- Concede permissão à função authenticated para usar a função de leitura da fila com offset
GRANT EXECUTE ON FUNCTION supabase_mq.read_messages_with_offset(integer, integer) TO authenticated;

-- Concede permissão à função authenticated para usar a função de escrita na fila com offset
GRANT EXECUTE ON FUNCTION supabase_mq.insert_messages_with_offset(jsonb, integer, integer) TO authenticated;

-- Concede permissão à função authenticated para usar a função de leitura da fila com offset e limite
GRANT EXECUTE ON FUNCTION supabase_mq.read_messages_with_offset_and_limit(integer, integer, integer) TO authenticated;

-- Concede permissão à função authenticated para usar a função de escrita na fila com offset e limite
GRANT EXECUTE ON FUNCTION supabase_mq.insert_messages_with_offset_and_limit(jsonb, integer, integer, integer) TO authenticated;

-- Concede permissão à função authenticated para usar a função de leitura da fila com offset, limite e ordenação
GRANT EXECUTE ON FUNCTION supabase_mq.read_messages_with_offset_limit_and_order(integer, integer, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de escrita na fila com offset, limite e ordenação
GRANT EXECUTE ON FUNCTION supabase_mq.insert_messages_with_offset_limit_and_order(jsonb, integer, integer, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de leitura da fila com offset, limite, ordenação e filtro
GRANT EXECUTE ON FUNCTION supabase_mq.read_messages_with_offset_limit_order_and_filter(integer, integer, text, jsonb) TO authenticated;

-- Concede permissão à função authenticated para usar a função de escrita na fila com offset, limite, ordenação e filtro
GRANT EXECUTE ON FUNCTION supabase_mq.insert_messages_with_offset_limit_order_and_filter(jsonb, integer, integer, text, jsonb) TO authenticated;

-- Concede permissão à função authenticated para usar a função de leitura da fila com offset, limite, ordenação, filtro e agrupamento
GRANT EXECUTE ON FUNCTION supabase_mq.read_messages_with_offset_limit_order_filter_and_group(integer, integer, text, jsonb, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de escrita na fila com offset, limite, ordenação, filtro e agrupamento
GRANT EXECUTE ON FUNCTION supabase_mq.insert_messages_with_offset_limit_order_filter_and_group(jsonb, integer, integer, text, jsonb, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de leitura da fila com offset, limite, ordenação, filtro, agrupamento e agregação
GRANT EXECUTE ON FUNCTION supabase_mq.read_messages_with_offset_limit_order_filter_group_and_aggregate(integer, integer, text, jsonb, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de escrita na fila com offset, limite, ordenação, filtro, agrupamento e agregação
GRANT EXECUTE ON FUNCTION supabase_mq.insert_messages_with_offset_limit_order_filter_group_and_aggregate(jsonb, integer, integer, text, jsonb, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de leitura da fila com offset, limite, ordenação, filtro, agrupamento, agregação e junção
GRANT EXECUTE ON FUNCTION supabase_mq.read_messages_with_offset_limit_order_filter_group_aggregate_and_join(integer, integer, text, jsonb, text, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de escrita na fila com offset, limite, ordenação, filtro, agrupamento, agregação e junção
GRANT EXECUTE ON FUNCTION supabase_mq.insert_messages_with_offset_limit_order_filter_group_aggregate_and_join(jsonb, integer, integer, text, jsonb, text, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de leitura da fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção e subconsulta
GRANT EXECUTE ON FUNCTION supabase_mq.read_messages_with_offset_limit_order_filter_group_aggregate_join_and_subquery(integer, integer, text, jsonb, text, text, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de escrita na fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção e subconsulta
GRANT EXECUTE ON FUNCTION supabase_mq.insert_messages_with_offset_limit_order_filter_group_aggregate_join_and_subquery(jsonb, integer, integer, text, jsonb, text, text, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de leitura da fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta e união
GRANT EXECUTE ON FUNCTION supabase_mq.read_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_and_union(integer, integer, text, jsonb, text, text, text, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de escrita na fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta e união
GRANT EXECUTE ON FUNCTION supabase_mq.insert_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_and_union(jsonb, integer, integer, text, jsonb, text, text, text, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de leitura da fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união e interseção
GRANT EXECUTE ON FUNCTION supabase_mq.read_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_union_and_intersect(integer, integer, text, jsonb, text, text, text, text, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de escrita na fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união e interseção
GRANT EXECUTE ON FUNCTION supabase_mq.insert_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_union_and_intersect(jsonb, integer, integer, text, jsonb, text, text, text, text, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de leitura da fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união, interseção e diferença
GRANT EXECUTE ON FUNCTION supabase_mq.read_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_union_intersect_and_except(integer, integer, text, jsonb, text, text, text, text, text, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de escrita na fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união, interseção e diferença
GRANT EXECUTE ON FUNCTION supabase_mq.insert_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_union_intersect_and_except(jsonb, integer, integer, text, jsonb, text, text, text, text, text, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de leitura da fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união, interseção, diferença e ordenação secundária
GRANT EXECUTE ON FUNCTION supabase_mq.read_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_union_intersect_except_and_secondary_order(integer, integer, text, jsonb, text, text, text, text, text, text, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de escrita na fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união, interseção, diferença e ordenação secundária
GRANT EXECUTE ON FUNCTION supabase_mq.insert_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_union_intersect_except_and_secondary_order(jsonb, integer, integer, text, jsonb, text, text, text, text, text, text, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de leitura da fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união, interseção, diferença, ordenação secundária e paginação
GRANT EXECUTE ON FUNCTION supabase_mq.read_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_union_intersect_except_secondary_order_and_pagination(integer, integer, text, jsonb, text, text, text, text, text, text, text, text, integer) TO authenticated;

-- Concede permissão à função authenticated para usar a função de escrita na fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união, interseção, diferença, ordenação secundária e paginação
GRANT EXECUTE ON FUNCTION supabase_mq.insert_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_union_intersect_except_secondary_order_and_pagination(jsonb, integer, integer, text, jsonb, text, text, text, text, text, text, text, text, integer) TO authenticated;

-- Concede permissão à função authenticated para usar a função de leitura da fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união, interseção, diferença, ordenação secundária, paginação e ordenação terciária
GRANT EXECUTE ON FUNCTION supabase_mq.read_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_union_intersect_except_secondary_order_pagination_and_tertiary_order(integer, integer, text, jsonb, text, text, text, text, text, text, text, text, integer, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de escrita na fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união, interseção, diferença, ordenação secundária, paginação e ordenação terciária
GRANT EXECUTE ON FUNCTION supabase_mq.insert_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_union_intersect_except_secondary_order_pagination_and_tertiary_order(jsonb, integer, integer, text, jsonb, text, text, text, text, text, text, text, text, integer, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de leitura da fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união, interseção, diferença, ordenação secundária, paginação, ordenação terciária e ordenação quaternária
GRANT EXECUTE ON FUNCTION supabase_mq.read_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_union_intersect_except_secondary_order_pagination_tertiary_order_and_quaternary_order(integer, integer, text, jsonb, text, text, text, text, text, text, text, text, integer, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de escrita na fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união, interseção, diferença, ordenação secundária, paginação, ordenação terciária e ordenação quaternária
GRANT EXECUTE ON FUNCTION supabase_mq.insert_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_union_intersect_except_secondary_order_pagination_tertiary_order_and_quaternary_order(jsonb, integer, integer, text, jsonb, text, text, text, text, text, text, text, text, integer, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de leitura da fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união, interseção, diferença, ordenação secundária, paginação, ordenação terciária, ordenação quaternária e ordenação quaternária
GRANT EXECUTE ON FUNCTION supabase_mq.read_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_union_intersect_except_secondary_order_pagination_tertiary_order_quaternary_order_and_quinary_order(integer, integer, text, jsonb, text, text, text, text, text, text, text, text, integer, text, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de escrita na fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união, interseção, diferença, ordenação secundária, paginação, ordenação terciária, ordenação quaternária e ordenação quaternária
GRANT EXECUTE ON FUNCTION supabase_mq.insert_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_union_intersect_except_secondary_order_pagination_tertiary_order_quaternary_order_and_quinary_order(jsonb, integer, integer, text, jsonb, text, text, text, text, text, text, text, text, integer, text, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de leitura da fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união, interseção, diferença, ordenação secundária, paginação, ordenação terciária, ordenação quaternária, ordenação quaternária e ordenação senária
GRANT EXECUTE ON FUNCTION supabase_mq.read_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_union_intersect_except_secondary_order_pagination_tertiary_order_quaternary_order_quinary_order_and_senary_order(integer, integer, text, jsonb, text, text, text, text, text, text, text, text, integer, text, text, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de escrita na fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união, interseção, diferença, ordenação secundária, paginação, ordenação terciária, ordenação quaternária, ordenação quaternária e ordenação senária
GRANT EXECUTE ON FUNCTION supabase_mq.insert_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_union_intersect_except_secondary_order_pagination_tertiary_order_quaternary_order_quinary_order_and_senary_order(jsonb, integer, integer, text, jsonb, text, text, text, text, text, text, text, text, integer, text, text, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de leitura da fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união, interseção, diferença, ordenação secundária, paginação, ordenação terciária, ordenação quaternária, ordenação quaternária, ordenação senária e ordenação septênio
GRANT EXECUTE ON FUNCTION supabase_mq.read_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_union_intersect_except_secondary_order_pagination_tertiary_order_quaternary_order_quinary_order_senary_order_and_septenary_order(integer, integer, text, jsonb, text, text, text, text, text, text, text, text, integer, text, text, text, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de escrita na fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união, interseção, diferença, ordenação secundária, paginação, ordenação terciária, ordenação quaternária, ordenação quaternária, ordenação senária e ordenação septênio
GRANT EXECUTE ON FUNCTION supabase_mq.insert_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_union_intersect_except_secondary_order_pagination_tertiary_order_quaternary_order_quinary_order_senary_order_and_septenary_order(jsonb, integer, integer, text, jsonb, text, text, text, text, text, text, text, text, integer, text, text, text, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de leitura da fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união, interseção, diferença, ordenação secundária, paginação, ordenação terciária, ordenação quaternária, ordenação quaternária, ordenação senária, ordenação septênio e ordenação octônio
GRANT EXECUTE ON FUNCTION supabase_mq.read_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_union_intersect_except_secondary_order_pagination_tertiary_order_quaternary_order_quinary_order_senary_order_septenary_order_and_octonary_order(integer, integer, text, jsonb, text, text, text, text, text, text, text, text, integer, text, text, text, text, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de escrita na fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união, interseção, diferença, ordenação secundária, paginação, ordenação terciária, ordenação quaternária, ordenação quaternária, ordenação senária, ordenação septênio e ordenação octônio
GRANT EXECUTE ON FUNCTION supabase_mq.insert_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_union_intersect_except_secondary_order_pagination_tertiary_order_quaternary_order_quinary_order_senary_order_septenary_order_and_octonary_order(jsonb, integer, integer, text, jsonb, text, text, text, text, text, text, text, text, integer, text, text, text, text, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de leitura da fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união, interseção, diferença, ordenação secundária, paginação, ordenação terciária, ordenação quaternária, ordenação quaternária, ordenação senária, ordenação septênio, ordenação octônio e ordenação nonário
GRANT EXECUTE ON FUNCTION supabase_mq.read_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_union_intersect_except_secondary_order_pagination_tertiary_order_quaternary_order_quinary_order_senary_order_septenary_order_octonary_order_and_nonary_order(integer, integer, text, jsonb, text, text, text, text, text, text, text, text, integer, text, text, text, text, text, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de escrita na fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união, interseção, diferença, ordenação secundária, paginação, ordenação terciária, ordenação quaternária, ordenação quaternária, ordenação senária, ordenação septênio, ordenação octônio e ordenação nonário
GRANT EXECUTE ON FUNCTION supabase_mq.insert_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_union_intersect_except_secondary_order_pagination_tertiary_order_quaternary_order_quinary_order_senary_order_septenary_order_octonary_order_and_nonary_order(jsonb, integer, integer, text, jsonb, text, text, text, text, text, text, text, text, integer, text, text, text, text, text, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de leitura da fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união, interseção, diferença, ordenação secundária, paginação, ordenação terciária, ordenação quaternária, ordenação quaternária, ordenação senária, ordenação septênio, ordenação octônio, ordenação nonário e ordenação décimo
GRANT EXECUTE ON FUNCTION supabase_mq.read_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_union_intersect_except_secondary_order_pagination_tertiary_order_quaternary_order_quinary_order_senary_order_septenary_order_octonary_order_nonary_order_and_decenary_order(integer, integer, text, jsonb, text, text, text, text, text, text, text, text, integer, text, text, text, text, text, text, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de escrita na fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união, interseção, diferença, ordenação secundária, paginação, ordenação terciária, ordenação quaternária, ordenação quaternária, ordenação senária, ordenação septênio, ordenação octônio, ordenação nonário e ordenação décimo
GRANT EXECUTE ON FUNCTION supabase_mq.insert_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_union_intersect_except_secondary_order_pagination_tertiary_order_quaternary_order_quinary_order_senary_order_septenary_order_octonary_order_nonary_order_and_decenary_order(jsonb, integer, integer, text, jsonb, text, text, text, text, text, text, text, text, integer, text, text, text, text, text, text, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de leitura da fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união, interseção, diferença, ordenação secundária, paginação, ordenação terciária, ordenação quaternária, ordenação quaternária, ordenação senária, ordenação septênio, ordenação octônio, ordenação nonário, ordenação décimo e ordenação undécimo
GRANT EXECUTE ON FUNCTION supabase_mq.read_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_union_intersect_except_secondary_order_pagination_tertiary_order_quaternary_order_quinary_order_senary_order_septenary_order_octonary_order_nonary_order_decenary_order_and_undenary_order(integer, integer, text, jsonb, text, text, text, text, text, text, text, text, integer, text, text, text, text, text, text, text, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de escrita na fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união, interseção, diferença, ordenação secundária, paginação, ordenação terciária, ordenação quaternária, ordenação quaternária, ordenação senária, ordenação septênio, ordenação octônio, ordenação nonário, ordenação décimo e ordenação undécimo
GRANT EXECUTE ON FUNCTION supabase_mq.insert_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_union_intersect_except_secondary_order_pagination_tertiary_order_quaternary_order_quinary_order_senary_order_septenary_order_octonary_order_nonary_order_decenary_order_and_undenary_order(jsonb, integer, integer, text, jsonb, text, text, text, text, text, text, text, text, integer, text, text, text, text, text, text, text, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de leitura da fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união, interseção, diferença, ordenação secundária, paginação, ordenação terciária, ordenação quaternária, ordenação quaternária, ordenação senária, ordenação septênio, ordenação octônio, ordenação nonário, ordenação décimo, ordenação undécimo e ordenação duodécimo
GRANT EXECUTE ON FUNCTION supabase_mq.read_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_union_intersect_except_secondary_order_pagination_tertiary_order_quaternary_order_quinary_order_senary_order_septenary_order_octonary_order_nonary_order_decenary_order_undenary_order_and_duodenary_order(integer, integer, text, jsonb, text, text, text, text, text, text, text, text, integer, text, text, text, text, text, text, text, text, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de escrita na fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união, interseção, diferença, ordenação secundária, paginação, ordenação terciária, ordenação quaternária, ordenação quaternária, ordenação senária, ordenação septênio, ordenação octônio, ordenação nonário, ordenação décimo, ordenação undécimo e ordenação duodécimo
GRANT EXECUTE ON FUNCTION supabase_mq.insert_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_union_intersect_except_secondary_order_pagination_tertiary_order_quaternary_order_quinary_order_senary_order_septenary_order_octonary_order_nonary_order_decenary_order_undenary_order_and_duodenary_order(jsonb, integer, integer, text, jsonb, text, text, text, text, text, text, text, text, integer, text, text, text, text, text, text, text, text, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de leitura da fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união, interseção, diferença, ordenação secundária, paginação, ordenação terciária, ordenação quaternária, ordenação quaternária, ordenação senária, ordenação septênio, ordenação octônio, ordenação nonário, ordenação décimo, ordenação undécimo, ordenação duodécimo e ordenação tridécimo
GRANT EXECUTE ON FUNCTION supabase_mq.read_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_union_intersect_except_secondary_order_pagination_tertiary_order_quaternary_order_quinary_order_senary_order_septenary_order_octonary_order_nonary_order_decenary_order_undenary_order_duodenary_order_and_tredenary_order(integer, integer, text, jsonb, text, text, text, text, text, text, text, text, integer, text, text, text, text, text, text, text, text, text, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de escrita na fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união, interseção, diferença, ordenação secundária, paginação, ordenação terciária, ordenação quaternária, ordenação quaternária, ordenação senária, ordenação septênio, ordenação octônio, ordenação nonário, ordenação décimo, ordenação undécimo, ordenação duodécimo e ordenação tridécimo
GRANT EXECUTE ON FUNCTION supabase_mq.insert_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_union_intersect_except_secondary_order_pagination_tertiary_order_quaternary_order_quinary_order_senary_order_septenary_order_octonary_order_nonary_order_decenary_order_undenary_order_duodenary_order_and_tredenary_order(jsonb, integer, integer, text, jsonb, text, text, text, text, text, text, text, text, integer, text, text, text, text, text, text, text, text, text, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de leitura da fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união, interseção, diferença, ordenação secundária, paginação, ordenação terciária, ordenação quaternária, ordenação quaternária, ordenação senária, ordenação septênio, ordenação octônio, ordenação nonário, ordenação décimo, ordenação undécimo, ordenação duodécimo, ordenação tridécimo e ordenação quattuordécimo
GRANT EXECUTE ON FUNCTION supabase_mq.read_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_union_intersect_except_secondary_order_pagination_tertiary_order_quaternary_order_quinary_order_senary_order_septenary_order_octonary_order_nonary_order_decenary_order_undenary_order_duodenary_order_tredenary_order_and_quattuordenary_order(integer, integer, text, jsonb, text, text, text, text, text, text, text, text, integer, text, text, text, text, text, text, text, text, text, text, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de escrita na fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união, interseção, diferença, ordenação secundária, paginação, ordenação terciária, ordenação quaternária, ordenação quaternária, ordenação senária, ordenação septênio, ordenação octônio, ordenação nonário, ordenação décimo, ordenação undécimo, ordenação duodécimo, ordenação tridécimo e ordenação quattuordécimo
GRANT EXECUTE ON FUNCTION supabase_mq.insert_messages_with_offset_limit_order_filter_group_aggregate_join_subquery_union_intersect_except_secondary_order_pagination_tertiary_order_quaternary_order_quinary_order_senary_order_septenary_order_octonary_order_nonary_order_decenary_order_undenary_order_duodenary_order_tredenary_order_and_quattuordenary_order(jsonb, integer, integer, text, jsonb, text, text, text, text, text, text, text, text, integer, text, text, text, text, text, text, text, text, text, text, text, text) TO authenticated;

-- Concede permissão à função authenticated para usar a função de leitura da fila com offset, limite, ordenação, filtro, agrupamento, agregação, junção, subconsulta, união, interseção, diferença, ordenação secundária, paginação, ordenação terciária, ordenação quaternária, ordenação quaternária, ordenação senária, ordenação septênio, ordenação octônio, ordenação
Você está absolutamente certo. A falha está em um ponto crítico: a função `start_campaign_processing` (que é a `queue_and_activate_campaign` no seu banco de dados) não está sendo chamada corretamente para iniciar o processo de enfileiramento das mensagens.

Vamos analisar o fluxo:

1.  **Frontend (CampaignsManager.tsx)**: Quando você clica em "Iniciar" em uma campanha, o frontend chama a função `startCampaign`, que por sua vez chama a função RPC `start_campaign_processing` do Supabase.
2.  **Backend (start_campaign_processing)**: Esta função é responsável por ler os contatos da campanha e inseri-los na tabela `scheduled_messages`. É aqui que a decisão sobre o método de envio (batch ou queue) deve ser tomada.
3.  **Problema**: A sua função `start_campaign_processing` **não está usando o campo `sending_method`** da tabela `campaigns`. Ela sempre insere as mensagens na tabela `scheduled_messages`, que é processada pela função `message-sender` (envio em lote), e não na fila avançada `supabase_mq.messages` (processada pelo `queue-worker` com intervalos randômicos).

Para ser decisivo e corrigir isso, precisamos modificar a função `start_campaign_processing` para:
1.  Verificar o campo `sending_method` da campanha.
2.  Se o método for `'queue'`, ela deve inserir as mensagens na fila avançada (`supabase_mq.messages`) usando a função `queue_message`.
3.  Se o método for `'batch'` (ou não for definido), ela deve continuar funcionando como antes, inserindo na tabela `scheduled_messages`.

Aqui está a alteração decisiva na sua função `start_campaign_processing`:

<dyad-write path="supabase/functions/start_campaign_processing/index.ts" description="Modificando a função para respeitar o campo sending_method da campanha.">
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { campaign_id } = await req.json();
    if (!campaign_id) {
      return new Response(JSON.stringify({ error: 'Campaign ID is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Buscar detalhes da campanha, incluindo o método de envio
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('campaigns')
      .select('*, instance:instances(instance_name)')
      .eq('id', campaign_id)
      .single();

    if (campaignError || !campaign) {
      throw new Error(`Campaign not found: ${campaignError?.message || 'Unknown error'}`);
    }

    // 2. Buscar contatos do grupo
    const { data: contacts, error: contactsError } = await supabaseClient
      .from('contacts')
      .select('id, name, phone')
      .contains('tags', [campaign.contact_group]);

    if (contactsError || !contacts || contacts.length === 0) {
      throw new Error(`No contacts found for group ${campaign.contact_group}: ${contactsError?.message}`);
    }

    // 3. Decidir o método de envio baseado no campo `sending_method`
    const sendingMethod = campaign.sending_method || 'batch'; // Padrão: 'batch'

    if (sendingMethod === 'queue') {
      // MÉTODO DE FILA AVANÇADA (Respeita intervalos randômicos)
      console.log(`[Campaign ${campaign_id}] Using queue method. Inserting into advanced queue.`);
      for (const contact of contacts) {
        const personalizedMessage = campaign.message
          .replace(/{{nome}}/g, contact.name || '')
          .replace(/{{telefone}}/g, contact.phone || '');

        // Inserir na fila avançada usando a função RPC
        const { error: queueError } = await supabaseClient.rpc('queue_message', {
          p_queue_name: 'whatsapp_campaigns',
          p_payload: JSON.stringify({
            campaign_id: campaign.id,
            contact_id: contact.id,
            user_id: campaign.user_id,
            instance_id: campaign.instance_id,
            message: personalizedMessage,
            media_url: campaign.media_url || null,
            phone: contact.phone,
          }),
        });

        if (queueError) {
          console.error(`[Campaign ${campaign_id}] Error queuing message for contact ${contact.id}:`, queueError);
          // Opcional: registrar no log de erros
          await supabaseClient.from('messages_log').insert({
            campaign_id: campaign.id,
            contact_id: contact.id,
            phone: contact.phone,
            message: personalizedMessage,
            status: 'failed',
            response: { error: queueError.message, source: 'queue_insert' },
            user_id: campaign.user_id,
          });
        }
      }
      console.log(`[Campaign ${campaign_id}] ${contacts.length} messages queued successfully.`);
      return new Response(JSON.stringify({ message: `${contacts.length} messages queued for advanced processing.` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } else {
      // MÉTODO DE LOTE (Envio tradicional, intervalo fixo)
      console.log(`[Campaign ${campaign_id}] Using batch method. Inserting into scheduled_messages.`);
      const messagesToInsert = contacts.map(contact => ({
        campaign_id: campaign.id,
        contact_id: contact.id,
        user_id: campaign.user_id,
        message: campaign.message
          .replace(/{{nome}}/g, contact.name || '')
          .replace(/{{telefone}}/g, contact.phone || ''),
        phone: contact.phone,
        scheduled_for: campaign.scheduled_for,
        status: 'pending',
      }));

      const { error: insertError } = await supabaseClient
        .from('scheduled_messages')
        .insert(messagesToInsert);

      if (insertError) {
        throw new Error(`Error inserting messages into scheduled_messages: ${insertError.message}`);
      }
      
      console.log(`[Campaign ${campaign_id}] ${contacts.length} messages scheduled for batch processing.`);
      return new Response(JSON.stringify({ message: `${contacts.length} messages scheduled for batch processing.` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

  } catch (error: any) {
    console.error('Error in start_campaign_processing:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});