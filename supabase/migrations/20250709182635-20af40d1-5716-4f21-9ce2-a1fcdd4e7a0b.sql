-- Criar função security definer para evitar recursão infinita
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Recriar a política de admins usando a função
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles" 
ON public.profiles
FOR SELECT 
USING (public.get_current_user_role() = 'admin');

-- Adicionar validação para múltiplas assinaturas trial
CREATE OR REPLACE FUNCTION public.check_trial_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  trial_plan_id UUID;
  existing_trial_count INTEGER;
BEGIN
  -- Buscar o plano trial
  SELECT id INTO trial_plan_id FROM public.plans WHERE name = 'trial';
  
  -- Se não é um plano trial, permitir
  IF NEW.plan_id != trial_plan_id THEN
    RETURN NEW;
  END IF;
  
  -- Verificar se o usuário já tem uma assinatura trial
  SELECT COUNT(*) INTO existing_trial_count 
  FROM public.user_subscriptions 
  WHERE user_id = NEW.user_id 
    AND plan_id = trial_plan_id;
  
  -- Se já tem trial, bloquear
  IF existing_trial_count > 0 THEN
    RAISE EXCEPTION 'Usuário já utilizou o plano trial anteriormente';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para validar trial
DROP TRIGGER IF EXISTS check_trial_subscription_trigger ON public.user_subscriptions;
CREATE TRIGGER check_trial_subscription_trigger
  BEFORE INSERT ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.check_trial_subscription();