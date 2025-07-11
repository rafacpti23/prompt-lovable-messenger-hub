
-- Criar tabela de planos
CREATE TABLE public.plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  credits INTEGER NOT NULL,
  price_per_message DECIMAL(10,4) NOT NULL,
  duration_days INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserir planos padrão
INSERT INTO public.plans (name, price, credits, price_per_message, duration_days) VALUES
('trial', 0.00, 10, 0.0000, 1),
('starter', 49.90, 1000, 0.0499, 30),
('master', 79.90, 2000, 0.0399, 30);

-- Criar tabela de assinaturas dos usuários
CREATE TABLE public.user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.plans(id) NOT NULL,
  credits_remaining INTEGER NOT NULL DEFAULT 0,
  total_credits INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar tabela de transações/pagamentos
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.plans(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  payment_method TEXT,
  payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Políticas para plans (todos podem ver planos ativos)
CREATE POLICY "Anyone can view active plans" ON public.plans
  FOR SELECT USING (is_active = true);

-- Políticas para user_subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own subscriptions" ON public.user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Triggers para updated_at
CREATE TRIGGER user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Função para criar assinatura de teste quando usuário se registra
CREATE OR REPLACE FUNCTION public.create_trial_subscription()
RETURNS TRIGGER AS $$
DECLARE
  trial_plan_id UUID;
BEGIN
  -- Buscar o plano trial
  SELECT id INTO trial_plan_id FROM public.plans WHERE name = 'trial';
  
  -- Criar assinatura trial
  IF trial_plan_id IS NOT NULL THEN
    INSERT INTO public.user_subscriptions (
      user_id, 
      plan_id, 
      credits_remaining, 
      total_credits, 
      expires_at
    ) VALUES (
      NEW.id,
      trial_plan_id,
      10,
      10,
      timezone('utc'::text, now()) + INTERVAL '1 day'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar assinatura trial automaticamente
CREATE TRIGGER on_user_created_trial
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_trial_subscription();

-- Função para decrementar créditos quando mensagem é enviada
CREATE OR REPLACE FUNCTION public.decrement_user_credits(user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_subscription RECORD;
BEGIN
  -- Buscar assinatura ativa do usuário
  SELECT * INTO current_subscription
  FROM public.user_subscriptions 
  WHERE user_id = user_id_param 
    AND status = 'active' 
    AND (expires_at IS NULL OR expires_at > NOW())
    AND credits_remaining > 0
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Se não encontrou assinatura ativa com créditos, retorna false
  IF current_subscription IS NULL THEN
    RETURN false;
  END IF;
  
  -- Decrementar crédito
  UPDATE public.user_subscriptions 
  SET credits_remaining = credits_remaining - 1,
      updated_at = timezone('utc'::text, now())
  WHERE id = current_subscription.id;
  
  -- Se créditos chegaram a zero, marcar como expirada
  IF current_subscription.credits_remaining - 1 = 0 THEN
    UPDATE public.user_subscriptions 
    SET status = 'expired',
        updated_at = timezone('utc'::text, now())
    WHERE id = current_subscription.id;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
