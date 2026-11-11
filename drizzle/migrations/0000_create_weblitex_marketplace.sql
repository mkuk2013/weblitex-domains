CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.request_status AS ENUM ('awaiting_payment', 'payment_submitted', 'review_pending', 'approved', 'rejected');
CREATE TYPE public.payment_status AS ENUM ('pending', 'submitted', 'waived', 'verified', 'rejected');
CREATE TYPE public.dns_record_type AS ENUM ('A', 'AAAA', 'CNAME', 'TXT', 'MX');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

CREATE TABLE public.domain_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  prefix TEXT NOT NULL,
  status public.request_status NOT NULL DEFAULT 'awaiting_payment',
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  payment_reference TEXT,
  price_pkr INTEGER NOT NULL DEFAULT 300 CHECK (price_pkr >= 0),
  promo_applied BOOLEAN NOT NULL DEFAULT false,
  reviewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_prefix CHECK (prefix ~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$'),
  CONSTRAINT reserved_prefix CHECK (prefix NOT IN ('admin', 'api', 'www'))
);
CREATE UNIQUE INDEX domain_requests_active_prefix_key ON public.domain_requests(prefix) WHERE status <> 'rejected';
GRANT SELECT, INSERT, UPDATE ON public.domain_requests TO authenticated;
GRANT SELECT (id, prefix, status) ON public.domain_requests TO anon;
GRANT ALL ON public.domain_requests TO service_role;
ALTER TABLE public.domain_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public checks active prefixes" ON public.domain_requests FOR SELECT TO anon USING (status <> 'rejected');
CREATE POLICY "Users read own requests" ON public.domain_requests FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Confirmed users create requests" ON public.domain_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND (auth.jwt() ->> 'email_confirmed_at') IS NOT NULL);
CREATE POLICY "Users update own pending payments" ON public.domain_requests FOR UPDATE TO authenticated USING (auth.uid() = user_id AND status = 'awaiting_payment') WITH CHECK (auth.uid() = user_id AND status IN ('awaiting_payment', 'payment_submitted'));
CREATE POLICY "Admins review requests" ON public.domain_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash TEXT NOT NULL UNIQUE,
  usage_limit INTEGER NOT NULL DEFAULT 1 CHECK (usage_limit > 0),
  times_used INTEGER NOT NULL DEFAULT 0 CHECK (times_used >= 0),
  expires_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.promo_codes TO authenticated;
GRANT ALL ON public.promo_codes TO service_role;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage promo codes" ON public.promo_codes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.dns_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.domain_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  host TEXT NOT NULL DEFAULT '@',
  type public.dns_record_type NOT NULL,
  value TEXT NOT NULL,
  ttl INTEGER NOT NULL DEFAULT 3600 CHECK (ttl BETWEEN 60 AND 86400),
  priority INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (request_id, host, type, value)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dns_records TO authenticated;
GRANT ALL ON public.dns_records TO service_role;
ALTER TABLE public.dns_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read DNS records" ON public.dns_records FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners add DNS records" ON public.dns_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.domain_requests r WHERE r.id = request_id AND r.user_id = auth.uid() AND r.status = 'approved' AND (r.expires_at IS NULL OR r.expires_at > now())) AND (SELECT count(*) FROM public.dns_records d WHERE d.request_id = dns_records.request_id) < 50);
CREATE POLICY "Owners update DNS records" ON public.dns_records FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners delete DNS records" ON public.dns_records FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER domain_requests_updated_at BEFORE UPDATE ON public.domain_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER dns_records_updated_at BEFORE UPDATE ON public.dns_records FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();